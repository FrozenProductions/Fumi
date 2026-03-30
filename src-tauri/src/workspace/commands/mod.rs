use anyhow::Result;
use tauri::{command, State};

use crate::state::AppRuntimeState;

pub(crate) mod archive;
pub(crate) mod files;
pub(crate) mod session;

pub(super) type CommandResponse<T> = std::result::Result<T, String>;

fn format_command_error(error: anyhow::Error) -> String {
    format!("{error:#}")
}

pub(super) fn run_command<T>(operation: impl FnOnce() -> Result<T>) -> CommandResponse<T> {
    operation().map_err(format_command_error)
}

#[command]
pub fn set_workspace_unsaved_changes(state: State<AppRuntimeState>, has_unsaved_changes: bool) {
    state.set_workspace_unsaved_changes(has_unsaved_changes);
}
