//! Tauri event names and emit helpers for frontend-backend communication.

use tauri::{AppHandle, Emitter, Runtime};

use crate::executor::ExecutorStatusPayload;

pub(crate) const MAIN_WINDOW_LABEL: &str = "main";
pub(crate) const OPEN_SETTINGS_EVENT: &str = "app://open-settings";
pub(crate) const CHECK_FOR_UPDATES_EVENT: &str = "app://check-for-updates";
pub(crate) const PREPARE_FOR_EXIT_EVENT: &str = "app://prepare-for-exit";
pub(crate) const REQUEST_EXIT_GUARD_SYNC_EVENT: &str = "app://request-exit-guard-sync";
pub(crate) const ZOOM_IN_EVENT: &str = "app://zoom-in";
pub(crate) const ZOOM_OUT_EVENT: &str = "app://zoom-out";
pub(crate) const ZOOM_RESET_EVENT: &str = "app://zoom-reset";
pub(crate) const EXECUTOR_STATUS_CHANGED_EVENT: &str = "executor://status-changed";

fn emit_event<R: Runtime>(app: &AppHandle<R>, event: &str) -> tauri::Result<()> {
    app.emit(event, ())
}

pub(crate) fn emit_open_settings<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, OPEN_SETTINGS_EVENT)
}

pub(crate) fn emit_check_for_updates<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, CHECK_FOR_UPDATES_EVENT)
}

pub(crate) fn emit_prepare_for_exit<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, PREPARE_FOR_EXIT_EVENT)
}

pub(crate) fn emit_request_exit_guard_sync<R: Runtime>(
    app: &AppHandle<R>,
    sync_id: u64,
) -> tauri::Result<()> {
    app.emit(REQUEST_EXIT_GUARD_SYNC_EVENT, sync_id)
}

pub(crate) fn emit_zoom_in<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, ZOOM_IN_EVENT)
}

pub(crate) fn emit_zoom_out<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, ZOOM_OUT_EVENT)
}

pub(crate) fn emit_zoom_reset<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    emit_event(app, ZOOM_RESET_EVENT)
}

pub(crate) fn emit_executor_status_changed<R: Runtime>(
    app: &AppHandle<R>,
    payload: &ExecutorStatusPayload,
) -> tauri::Result<()> {
    app.emit(EXECUTOR_STATUS_CHANGED_EVENT, payload)
}
