use anyhow::Result;
use tauri::{command, AppHandle, State};

use super::{ExecutorRuntimeState, ExecutorStatusPayload};

type CommandResponse<T> = std::result::Result<T, String>;

fn format_command_error(error: anyhow::Error) -> String {
    format!("{error:#}")
}

fn run_command<T>(operation: impl FnOnce() -> Result<T>) -> CommandResponse<T> {
    operation().map_err(format_command_error)
}

#[command]
pub fn get_executor_status(state: State<ExecutorRuntimeState>) -> ExecutorStatusPayload {
    state.status()
}

#[command]
pub fn attach_executor(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
    port: u16,
) -> CommandResponse<ExecutorStatusPayload> {
    run_command(|| state.attach(&app, port))
}

#[command]
pub fn detach_executor(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
) -> CommandResponse<ExecutorStatusPayload> {
    run_command(|| state.detach(&app))
}

#[command]
pub fn reattach_executor(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
) -> CommandResponse<ExecutorStatusPayload> {
    run_command(|| state.reattach(&app))
}

#[command]
pub fn execute_executor_script(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
    script: String,
) -> CommandResponse<()> {
    run_command(|| state.execute_script(&app, &script))
}

#[command]
pub fn update_executor_setting(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
    key: String,
    value: bool,
) -> CommandResponse<()> {
    run_command(|| state.update_setting(&app, &key, value))
}
