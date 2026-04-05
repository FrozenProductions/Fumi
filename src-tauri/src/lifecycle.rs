use tauri::{Manager, WindowEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

use crate::{
    dialog,
    events::{emit_prepare_for_exit, emit_request_exit_guard_sync, MAIN_WINDOW_LABEL},
    state::AppRuntimeState,
    APP_TITLE,
};

const QUIT_CONFIRM_MESSAGE: &str =
    "Are you sure you want to quit, you have unsaved changes";
const FRONTEND_EXIT_GUARD_SYNC_TIMEOUT_MS: u64 = 250;
const FRONTEND_EXIT_PREPARATION_TIMEOUT_MS: u64 = 1_500;
const FRONTEND_POLL_INTERVAL_MS: u64 = 25;

#[derive(Clone, Copy)]
enum MainWindowTermination {
    CloseWindow,
    ExitApp,
}

impl MainWindowTermination {
    fn confirm_label(self) -> &'static str {
        match self {
            Self::CloseWindow => "Close",
            Self::ExitApp => "Quit",
        }
    }

    fn description(self) -> &'static str {
        match self {
            Self::CloseWindow => "close the main window",
            Self::ExitApp => "exit the app",
        }
    }
}

fn confirm_exit<R: tauri::Runtime>(app: &tauri::AppHandle<R>, confirm_label: &str) -> bool {
    dialog::show_warning_confirmation_dialog(
        app,
        dialog::ConfirmDialogOptions {
            title: APP_TITLE,
            message: QUIT_CONFIRM_MESSAGE,
            confirm_label,
            cancel_label: "Cancel",
        },
    )
    .unwrap_or_else(|error| {
        eprintln!("Failed to show native exit confirmation dialog: {error}");

        app.dialog()
            .message(QUIT_CONFIRM_MESSAGE)
            .title(APP_TITLE)
            .kind(MessageDialogKind::Warning)
            .buttons(MessageDialogButtons::OkCancelCustom(
                confirm_label.to_string(),
                "Cancel".to_string(),
            ))
            .blocking_show()
    })
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

fn complete_main_window_termination<R: tauri::Runtime + 'static>(
    app: tauri::AppHandle<R>,
    termination: MainWindowTermination,
) {
    match termination {
        MainWindowTermination::CloseWindow => {
            if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
                app.state::<AppRuntimeState>().allow_next_close_request();
                if let Err(error) = window.close() {
                    eprintln!("Failed to close main window: {error}");
                }
            }
        }
        MainWindowTermination::ExitApp => {
            app.state::<AppRuntimeState>().allow_next_exit_request();
            app.exit(0);
        }
    }
}

fn finalize_main_window_termination_after_frontend_prepared<R: tauri::Runtime + 'static>(
    app: tauri::AppHandle<R>,
    termination: MainWindowTermination,
) {
    match termination {
        MainWindowTermination::CloseWindow => close_main_window_after_frontend_prepared(app),
        MainWindowTermination::ExitApp => exit_app_after_frontend_prepared(app),
    }
}

fn continue_main_window_termination_request<R: tauri::Runtime + 'static>(
    app: tauri::AppHandle<R>,
    termination: MainWindowTermination,
) {
    let did_sync_exit_guard = sync_frontend_exit_guard(&app);
    let state = app.state::<AppRuntimeState>();
    let should_guard_exit = if did_sync_exit_guard {
        state.should_guard_exit()
    } else {
        true
    };

    if !should_guard_exit {
        complete_main_window_termination(app.clone(), termination);
        return;
    }

    if !confirm_exit(&app, termination.confirm_label()) {
        return;
    }

    if let Err(error) = prepare_for_exit(&app) {
        state.cancel_exit();
        eprintln!(
            "Failed to prepare to {}: {error}",
            termination.description()
        );
        return;
    }

    finalize_main_window_termination_after_frontend_prepared(app.clone(), termination);
}

pub(crate) fn request_app_exit<R: tauri::Runtime + 'static>(app: &tauri::AppHandle<R>) {
    let app_handle = app.clone();

    std::thread::spawn(move || {
        continue_main_window_termination_request(app_handle, MainWindowTermination::ExitApp);
    });
}

fn request_main_window_close<R: tauri::Runtime + 'static>(app: &tauri::AppHandle<R>) {
    let app_handle = app.clone();

    std::thread::spawn(move || {
        continue_main_window_termination_request(app_handle, MainWindowTermination::CloseWindow);
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
    request_main_window_close(&app);
}

fn handle_window_destroyed<R: tauri::Runtime>(window: &tauri::Window<R>) {
    if window.label() == MAIN_WINDOW_LABEL {
        window
            .app_handle()
            .state::<AppRuntimeState>()
            .allow_next_exit_request();
        window.app_handle().exit(0);
    }
}

pub(crate) fn handle_window_event<R: tauri::Runtime>(
    window: &tauri::Window<R>,
    event: &WindowEvent,
) {
    match event {
        WindowEvent::CloseRequested { api, .. } => handle_close_requested(window, api),
        WindowEvent::Destroyed => handle_window_destroyed(window),
        _ => {}
    }
}

pub(crate) fn handle_exit_requested<R: tauri::Runtime + 'static>(
    app: &tauri::AppHandle<R>,
    api: &tauri::ExitRequestApi,
) {
    if app
        .state::<AppRuntimeState>()
        .consume_next_exit_request_allowance()
    {
        return;
    }

    api.prevent_exit();
    request_app_exit(app);
}
