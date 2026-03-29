mod events;
mod menu;
mod state;
mod workspace;

use tauri::{Manager, WindowEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

use crate::{
    events::{emit_prepare_for_exit, emit_request_exit_guard_sync, MAIN_WINDOW_LABEL},
    state::AppRuntimeState,
};

const APP_TITLE: &str = "Fumi";
const QUIT_CONFIRM_MESSAGE: &str = "Are you sure you want to quit, you have unsaved changes";
const FRONTEND_EXIT_GUARD_SYNC_TIMEOUT_MS: u64 = 250;
const FRONTEND_EXIT_PREPARATION_TIMEOUT_MS: u64 = 1_500;
const FRONTEND_POLL_INTERVAL_MS: u64 = 25;

fn confirm_exit<R: tauri::Runtime>(app: &tauri::AppHandle<R>, confirm_label: &str) -> bool {
    app.dialog()
        .message(QUIT_CONFIRM_MESSAGE)
        .title(APP_TITLE)
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancelCustom(
            confirm_label.to_string(),
            "Cancel".to_string(),
        ))
        .blocking_show()
}

fn prepare_for_exit<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let state = app.state::<AppRuntimeState>();
    state.begin_exit();
    if let Err(error) = emit_prepare_for_exit(app) {
        state.cancel_exit();
        return Err(error);
    }

    Ok(())
}

fn wait_for_frontend_exit_preparation<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    use std::{
        thread,
        time::{Duration, Instant},
    };

    let deadline = Instant::now() + Duration::from_millis(FRONTEND_EXIT_PREPARATION_TIMEOUT_MS);

    while Instant::now() < deadline {
        if app.state::<AppRuntimeState>().is_frontend_ready_for_exit() {
            return;
        }

        thread::sleep(Duration::from_millis(FRONTEND_POLL_INTERVAL_MS));
    }
}

fn sync_frontend_exit_guard<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> bool {
    use std::{
        thread,
        time::{Duration, Instant},
    };

    let sync_id = app
        .state::<AppRuntimeState>()
        .next_exit_guard_sync_request_id();

    if let Err(error) = emit_request_exit_guard_sync(app, sync_id) {
        eprintln!("Failed to request exit guard sync from frontend: {error}");
        return false;
    }

    let deadline = Instant::now() + Duration::from_millis(FRONTEND_EXIT_GUARD_SYNC_TIMEOUT_MS);

    while Instant::now() < deadline {
        if app
            .state::<AppRuntimeState>()
            .has_completed_exit_guard_sync(sync_id)
        {
            return true;
        }

        thread::sleep(Duration::from_millis(FRONTEND_POLL_INTERVAL_MS));
    }

    false
}

fn close_main_window_after_frontend_prepared<R: tauri::Runtime + 'static>(
    app: tauri::AppHandle<R>,
) {
    std::thread::spawn(move || {
        wait_for_frontend_exit_preparation(&app);

        let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
            return;
        };

        if let Err(error) = window.close() {
            app.state::<AppRuntimeState>().cancel_exit();
            eprintln!("Failed to close main window after frontend exit preparation: {error}");
        }
    });
}

fn exit_app_after_frontend_prepared<R: tauri::Runtime + 'static>(app: tauri::AppHandle<R>) {
    std::thread::spawn(move || {
        wait_for_frontend_exit_preparation(&app);
        app.state::<AppRuntimeState>().allow_next_exit_request();
        app.exit(0);
    });
}

fn continue_app_exit_request<R: tauri::Runtime + 'static>(app: tauri::AppHandle<R>) {
    let did_sync_exit_guard = sync_frontend_exit_guard(&app);
    let state = app.state::<AppRuntimeState>();
    let should_guard_exit = if did_sync_exit_guard {
        state.should_guard_exit()
    } else {
        true
    };

    if !should_guard_exit {
        state.allow_next_exit_request();
        app.exit(0);
        return;
    }

    if !confirm_exit(&app, "Quit") {
        return;
    }

    if let Err(error) = prepare_for_exit(&app) {
        state.cancel_exit();
        eprintln!("Failed to prepare app exit: {error}");
        return;
    }

    exit_app_after_frontend_prepared(app.clone());
}

pub(crate) fn request_app_exit<R: tauri::Runtime + 'static>(app: &tauri::AppHandle<R>) {
    let app_handle = app.clone();

    std::thread::spawn(move || {
        continue_app_exit_request(app_handle);
    });
}

fn handle_close_requested<R: tauri::Runtime>(
    window: &tauri::Window<R>,
    api: &tauri::CloseRequestApi,
) {
    if window.label() != MAIN_WINDOW_LABEL {
        return;
    }

    let app = window.app_handle().clone();
    if app
        .state::<AppRuntimeState>()
        .consume_next_close_request_allowance()
    {
        return;
    }

    api.prevent_close();

    std::thread::spawn(move || {
        let did_sync_exit_guard = sync_frontend_exit_guard(&app);
        let state = app.state::<AppRuntimeState>();
        let should_guard_exit = if did_sync_exit_guard {
            state.should_guard_exit()
        } else {
            true
        };

        if !should_guard_exit {
            if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
                state.allow_next_close_request();
                if let Err(error) = window.close() {
                    eprintln!("Failed to close main window: {error}");
                }
            }
            return;
        }

        if !confirm_exit(&app, "Close") {
            return;
        }

        if let Err(error) = prepare_for_exit(&app) {
            state.cancel_exit();
            eprintln!("Failed to close main window after confirmation: {error}");
            return;
        }

        close_main_window_after_frontend_prepared(app.clone());
    });
}

fn handle_window_destroyed<R: tauri::Runtime>(window: &tauri::Window<R>) {
    if window.label() == MAIN_WINDOW_LABEL {
        window.app_handle().exit(0);
    }
}

fn build_app() -> tauri::Result<tauri::App> {
    tauri::Builder::default()
        .manage(AppRuntimeState::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .menu(menu::build_app_menu)
        .on_menu_event(menu::handle_menu_event)
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => handle_close_requested(window, api),
            WindowEvent::Destroyed => handle_window_destroyed(window),
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            workspace::commands::bootstrap_workspace,
            workspace::commands::open_workspace,
            workspace::commands::refresh_workspace,
            workspace::commands::create_workspace_file,
            workspace::commands::save_workspace_file,
            workspace::commands::rename_workspace_file,
            workspace::commands::persist_workspace_state,
            workspace::commands::restore_archived_workspace_tab,
            workspace::commands::delete_archived_workspace_tab,
            workspace::commands::set_workspace_unsaved_changes,
            state::complete_exit_preparation,
            state::resolve_exit_guard_sync,
        ])
        .build(tauri::generate_context!())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> tauri::Result<()> {
    let app = build_app()?;

    app.run(|app, event| {
        if let tauri::RunEvent::ExitRequested { api, .. } = event {
            if app
                .state::<AppRuntimeState>()
                .consume_next_exit_request_allowance()
            {
                return;
            }

            api.prevent_exit();
            request_app_exit(app);
        }
    });

    Ok(())
}
