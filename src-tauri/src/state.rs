//! Shared application runtime state for exit guards and unsaved-change tracking.

use std::sync::{Mutex, MutexGuard};

use tauri::{command, State};

#[derive(Debug, Default)]
struct ShellState {
    has_workspace_unsaved_changes: bool,
    has_automatic_execution_unsaved_changes: bool,
    has_synced_unsaved_changes: bool,
    is_exit_in_progress: bool,
    is_frontend_ready_for_exit: bool,
    next_exit_guard_sync_request_id: u64,
    latest_completed_exit_guard_sync_id: u64,
    allow_next_close_request: bool,
    allow_next_exit_request: bool,
}

/// Shared mutex-guarded state for coordinating exit guards and unsaved-change tracking across the app.
#[derive(Debug, Default)]
pub struct AppRuntimeState {
    inner: Mutex<ShellState>,
}

impl AppRuntimeState {
    fn lock(&self) -> MutexGuard<'_, ShellState> {
        self.inner.lock().unwrap_or_else(|error| error.into_inner())
    }

    /// Updates whether the workspace has unsaved changes.
    pub fn set_workspace_unsaved_changes(&self, has_unsaved_changes: bool) {
        let mut state = self.lock();
        state.has_workspace_unsaved_changes = has_unsaved_changes;
        state.has_synced_unsaved_changes =
            state.has_workspace_unsaved_changes || state.has_automatic_execution_unsaved_changes;
    }

    /// Updates whether automatic execution has unsaved changes.
    pub fn set_automatic_execution_unsaved_changes(&self, has_unsaved_changes: bool) {
        let mut state = self.lock();
        state.has_automatic_execution_unsaved_changes = has_unsaved_changes;
        state.has_synced_unsaved_changes =
            state.has_workspace_unsaved_changes || state.has_automatic_execution_unsaved_changes;
    }

    pub fn next_exit_guard_sync_request_id(&self) -> u64 {
        let mut state = self.lock();
        state.next_exit_guard_sync_request_id += 1;
        state.next_exit_guard_sync_request_id
    }

    /// Resolves a pending exit-guard sync request with the frontend's decision.
    pub fn resolve_exit_guard_sync(&self, sync_id: u64, should_guard_exit: bool) {
        let mut state = self.lock();
        state.has_synced_unsaved_changes = should_guard_exit;
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
        state.has_synced_unsaved_changes && !state.is_exit_in_progress
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

/// Marks the frontend as ready for exit after completing cleanup.
#[command]
pub fn complete_exit_preparation(state: State<AppRuntimeState>) {
    state.mark_frontend_ready_for_exit();
}

/// Updates the unsaved-changes flag for automatic execution scripts.
#[command]
pub fn set_automatic_execution_unsaved_changes(
    state: State<AppRuntimeState>,
    has_unsaved_changes: bool,
) {
    state.set_automatic_execution_unsaved_changes(has_unsaved_changes);
}

/// Resolves a pending exit-guard sync request from the frontend.
#[command]
pub fn resolve_exit_guard_sync(
    state: State<AppRuntimeState>,
    sync_id: u64,
    should_guard_exit: bool,
) {
    state.resolve_exit_guard_sync(sync_id, should_guard_exit);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exit_lifecycle_tracks_guard_sync_and_frontend_readiness() {
        let state = AppRuntimeState::default();

        assert_eq!(state.next_exit_guard_sync_request_id(), 1);
        assert_eq!(state.next_exit_guard_sync_request_id(), 2);
        assert!(!state.has_completed_exit_guard_sync(1));

        state.set_workspace_unsaved_changes(true);
        assert!(state.should_guard_exit());

        state.resolve_exit_guard_sync(3, true);
        assert!(state.has_completed_exit_guard_sync(1));
        assert!(state.has_completed_exit_guard_sync(3));
        assert!(!state.has_completed_exit_guard_sync(4));

        state.begin_exit();
        assert!(!state.should_guard_exit());
        assert!(!state.is_frontend_ready_for_exit());

        state.mark_frontend_ready_for_exit();
        assert!(state.is_frontend_ready_for_exit());

        state.cancel_exit();
        assert!(!state.is_frontend_ready_for_exit());
        assert!(state.should_guard_exit());

        state.resolve_exit_guard_sync(4, false);
        assert!(!state.should_guard_exit());
    }

    #[test]
    fn close_and_exit_allowances_are_single_use() {
        let state = AppRuntimeState::default();

        assert!(!state.consume_next_close_request_allowance());
        state.allow_next_close_request();
        assert!(state.consume_next_close_request_allowance());
        assert!(!state.consume_next_close_request_allowance());

        assert!(!state.consume_next_exit_request_allowance());
        state.allow_next_exit_request();
        assert!(state.consume_next_exit_request_allowance());
        assert!(!state.consume_next_exit_request_allowance());
    }
}
