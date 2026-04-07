mod accounts;
pub(crate) mod binarycookies;
mod dialog;
mod events;
mod executor;
mod lifecycle;
mod menu;
mod state;
mod workspace;

use crate::{executor::ExecutorRuntimeState, state::AppRuntimeState};

pub(crate) const APP_TITLE: &str = "Fumi";

fn build_app() -> tauri::Result<tauri::App> {
    tauri::Builder::default()
        .manage(AppRuntimeState::default())
        .manage(ExecutorRuntimeState::default())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            Ok(())
        })
        .menu(menu::build_app_menu)
        .on_menu_event(menu::handle_menu_event)
        .on_window_event(lifecycle::handle_window_event)
        .invoke_handler(tauri::generate_handler![
            accounts::commands::list_accounts,
            accounts::commands::add_account,
            accounts::commands::launch_account,
            accounts::commands::delete_account,
            executor::commands::get_executor_status,
            executor::commands::attach_executor,
            executor::commands::detach_executor,
            executor::commands::reattach_executor,
            executor::commands::execute_executor_script,
            executor::commands::update_executor_setting,
            workspace::commands::session::bootstrap_workspace,
            workspace::commands::session::open_workspace,
            workspace::commands::session::refresh_workspace,
            workspace::commands::files::create_workspace_file,
            workspace::commands::files::save_workspace_file,
            workspace::commands::files::rename_workspace_file,
            workspace::commands::files::delete_workspace_file,
            workspace::commands::session::persist_workspace_state,
            workspace::commands::archive::restore_archived_workspace_tab,
            workspace::commands::archive::restore_all_archived_workspace_tabs,
            workspace::commands::archive::delete_archived_workspace_tab,
            workspace::commands::archive::delete_all_archived_workspace_tabs,
            workspace::commands::set_workspace_unsaved_changes,
            dialog::show_confirmation_dialog,
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
            lifecycle::handle_exit_requested(app, &api);
        }
    });

    Ok(())
}
