use std::sync::{Mutex, MutexGuard};

use tauri::{command, State};

#[derive(Debug, Default)]
struct ShellState {
    has_workspace_unsaved_changes: bool,
    is_exit_in_progress: bool,
    is_frontend_ready_for_exit: bool,
    next_exit_guard_sync_request_id: u64,
    latest_completed_exit_guard_sync_id: u64,
    allow_next_close_request: bool,
    allow_next_exit_request: bool,
}

#[derive(Debug, Default)]
pub struct AppRuntimeState {
    inner: Mutex<ShellState>,
}

impl AppRuntimeState {
    fn lock(&self) -> MutexGuard<'_, ShellState> {
        self.inner.lock().unwrap_or_else(|error| error.into_inner())
    }

    pub fn set_workspace_unsaved_changes(&self, has_unsaved_changes: bool) {
        self.lock().has_workspace_unsaved_changes = has_unsaved_changes;
    }

    pub fn next_exit_guard_sync_request_id(&self) -> u64 {
        let mut state = self.lock();
        state.next_exit_guard_sync_request_id += 1;
        state.next_exit_guard_sync_request_id
    }

    pub fn resolve_exit_guard_sync(&self, sync_id: u64, should_guard_exit: bool) {
        let mut state = self.lock();
        state.has_workspace_unsaved_changes = should_guard_exit;
        state.latest_completed_exit_guard_sync_id =
            state.latest_completed_exit_guard_sync_id.max(sync_id);
    }

    #[must_use]
    pub fn has_completed_exit_guard_sync(&self, sync_id: u64) -> bool {
        self.lock().latest_completed_exit_guard_sync_id >= sync_id
    }

    #[must_use]
    pub fn should_guard_exit(&self) -> bool {
        let state = self.lock();
        state.has_workspace_unsaved_changes && !state.is_exit_in_progress
    }

    pub fn begin_exit(&self) {
        let mut state = self.lock();
        state.is_exit_in_progress = true;
        state.is_frontend_ready_for_exit = false;
    }

    pub fn cancel_exit(&self) {
        let mut state = self.lock();
        state.is_exit_in_progress = false;
        state.is_frontend_ready_for_exit = false;
    }

    pub fn allow_next_close_request(&self) {
        self.lock().allow_next_close_request = true;
    }

    #[must_use]
    pub fn consume_next_close_request_allowance(&self) -> bool {
        let mut state = self.lock();
        let should_allow = state.allow_next_close_request;
        state.allow_next_close_request = false;
        should_allow
    }

    pub fn allow_next_exit_request(&self) {
        self.lock().allow_next_exit_request = true;
    }

    #[must_use]
    pub fn consume_next_exit_request_allowance(&self) -> bool {
        let mut state = self.lock();
        let should_allow = state.allow_next_exit_request;
        state.allow_next_exit_request = false;
        should_allow
    }

    pub fn mark_frontend_ready_for_exit(&self) {
        self.lock().is_frontend_ready_for_exit = true;
    }

    #[must_use]
    pub fn is_frontend_ready_for_exit(&self) -> bool {
        self.lock().is_frontend_ready_for_exit
    }
}

#[command]
pub fn complete_exit_preparation(state: State<AppRuntimeState>) {
    state.mark_frontend_ready_for_exit();
}

#[command]
pub fn resolve_exit_guard_sync(
    state: State<AppRuntimeState>,
    sync_id: u64,
    should_guard_exit: bool,
) {
    state.resolve_exit_guard_sync(sync_id, should_guard_exit);
}
