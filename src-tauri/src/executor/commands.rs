use tauri::{command, AppHandle, State};

use super::{ExecutorRuntimeState, ExecutorStatusPayload};
use crate::command::{run_command, CommandResponse};

/// Gets the current executor status including connection state and available ports.
#[command]
pub fn get_executor_status(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
) -> CommandResponse<ExecutorStatusPayload> {
    run_command(|| state.status(&app))
}

/// Attaches to an executor at the specified port.
#[command]
pub fn attach_executor(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
    port: u16,
) -> CommandResponse<ExecutorStatusPayload> {
    run_command(|| state.attach(&app, port))
}

/// Detaches from the current executor connection.
#[command]
pub fn detach_executor(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
) -> CommandResponse<ExecutorStatusPayload> {
    run_command(|| state.detach(&app))
}

/// Reattaches to the executor using the last known port.
#[command]
pub fn reattach_executor(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
) -> CommandResponse<ExecutorStatusPayload> {
    run_command(|| state.reattach(&app))
}

/// Executes a Lua script on the attached executor.
#[command]
pub fn execute_executor_script(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
    script: String,
) -> CommandResponse<()> {
    run_command(|| state.execute_script(&app, &script))
}

/// Updates an executor setting by key.
#[command]
pub fn update_executor_setting(
    app: AppHandle,
    state: State<ExecutorRuntimeState>,
    key: String,
    value: bool,
) -> CommandResponse<()> {
    run_command(|| state.update_setting(&app, &key, value))
}
