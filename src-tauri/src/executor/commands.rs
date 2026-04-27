use tauri::{command, AppHandle, State};

use super::{ExecutorRuntimeState, ExecutorStatusPayload};
use crate::command::{run_blocking_command, CommandResponse};

/// Gets the current executor status including connection state and available ports.
#[command]
pub async fn get_executor_status(
    app: AppHandle,
    state: State<'_, ExecutorRuntimeState>,
) -> CommandResponse<ExecutorStatusPayload> {
    let state = state.inner().clone();
    run_blocking_command(move || state.status(&app)).await
}

/// Attaches to an executor at the specified port.
#[command]
pub async fn attach_executor(
    app: AppHandle,
    state: State<'_, ExecutorRuntimeState>,
    port: u16,
) -> CommandResponse<ExecutorStatusPayload> {
    let state = state.inner().clone();
    run_blocking_command(move || state.attach(&app, port)).await
}

/// Detaches from the current executor connection.
#[command]
pub async fn detach_executor(
    app: AppHandle,
    state: State<'_, ExecutorRuntimeState>,
) -> CommandResponse<ExecutorStatusPayload> {
    let state = state.inner().clone();
    run_blocking_command(move || state.detach(&app)).await
}

/// Reattaches to the executor using the last known port.
#[command]
pub async fn reattach_executor(
    app: AppHandle,
    state: State<'_, ExecutorRuntimeState>,
) -> CommandResponse<ExecutorStatusPayload> {
    let state = state.inner().clone();
    run_blocking_command(move || state.reattach(&app)).await
}

/// Executes a Lua script on the attached executor.
#[command]
pub async fn execute_executor_script(
    app: AppHandle,
    state: State<'_, ExecutorRuntimeState>,
    script: String,
) -> CommandResponse<()> {
    let state = state.inner().clone();
    run_blocking_command(move || state.execute_script(&app, &script)).await
}

/// Updates an executor setting by key.
#[command]
pub async fn update_executor_setting(
    app: AppHandle,
    state: State<'_, ExecutorRuntimeState>,
    key: String,
    value: bool,
) -> CommandResponse<()> {
    let state = state.inner().clone();
    run_blocking_command(move || state.update_setting(&app, &key, value)).await
}
