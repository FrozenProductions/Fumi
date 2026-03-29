use tauri::{AppHandle, Emitter, Runtime};

pub const MAIN_WINDOW_LABEL: &str = "main";
pub const OPEN_SETTINGS_EVENT: &str = "app://open-settings";
pub const PREPARE_FOR_EXIT_EVENT: &str = "app://prepare-for-exit";
pub const REQUEST_EXIT_GUARD_SYNC_EVENT: &str = "app://request-exit-guard-sync";
pub const ZOOM_IN_EVENT: &str = "app://zoom-in";
pub const ZOOM_OUT_EVENT: &str = "app://zoom-out";
pub const ZOOM_RESET_EVENT: &str = "app://zoom-reset";

fn emit_event<R: Runtime>(app: &AppHandle<R>, event: &str) -> tauri::Result<()> {
    app.emit(event, ())
}

pub fn emit_open_settings<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, OPEN_SETTINGS_EVENT)
}

pub fn emit_prepare_for_exit<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, PREPARE_FOR_EXIT_EVENT)
}

pub fn emit_request_exit_guard_sync<R: Runtime>(
    app: &AppHandle<R>,
    sync_id: u64,
) -> tauri::Result<()> {
    app.emit(REQUEST_EXIT_GUARD_SYNC_EVENT, sync_id)
}

pub fn emit_zoom_in<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, ZOOM_IN_EVENT)
}

pub fn emit_zoom_out<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, ZOOM_OUT_EVENT)
}

pub fn emit_zoom_reset<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, ZOOM_RESET_EVENT)
}
