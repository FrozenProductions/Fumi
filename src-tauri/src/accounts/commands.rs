use tauri::{command, AppHandle};

use crate::accounts::models::{
    AccountListResponse, AccountSummary, RobloxAccountIdentity, RobloxProcessInfo,
};
use crate::accounts::{
    add_account as add_account_operation, delete_account as delete_account_operation,
    get_live_roblox_account as get_live_roblox_account_operation,
    kill_roblox_process as kill_roblox_process_operation,
    kill_roblox_processes as kill_roblox_processes_operation,
    launch_account as launch_account_operation, launch_roblox as launch_roblox_operation,
    list_accounts as list_accounts_operation,
    list_roblox_processes_with_bindings as list_roblox_processes_operation,
};
use crate::command::{format_command_error, run_blocking_command, CommandResponse};

/// Lists all saved Roblox accounts and whether Roblox is currently running.
#[command]
pub async fn list_accounts(app: AppHandle) -> CommandResponse<AccountListResponse> {
    run_blocking_command(move || list_accounts_operation(&app)).await
}

/// Adds a new Roblox account from a browser cookie string.
#[command]
pub async fn add_account(app: AppHandle, cookie: String) -> CommandResponse<AccountSummary> {
    add_account_operation(&app, &cookie)
        .await
        .map_err(format_command_error)
}

/// Launches a saved Roblox account by ID, returning the updated account summary.
#[command]
pub async fn launch_account(app: AppHandle, account_id: String) -> CommandResponse<AccountSummary> {
    run_blocking_command(move || launch_account_operation(&app, &account_id)).await
}

/// Deletes a saved Roblox account by ID.
#[command]
pub async fn delete_account(app: AppHandle, account_id: String) -> CommandResponse<()> {
    run_blocking_command(move || delete_account_operation(&app, &account_id)).await
}

/// Kills all running Roblox processes.
#[command]
pub async fn kill_roblox_processes(app: AppHandle) -> CommandResponse<()> {
    run_blocking_command(move || kill_roblox_processes_operation(&app)).await
}

/// Launches a new Roblox client instance.
#[command]
pub async fn launch_roblox(app: AppHandle) -> CommandResponse<()> {
    run_blocking_command(move || launch_roblox_operation(&app)).await
}

/// Lists all Roblox processes with their PIDs and bound account info.
#[command]
pub async fn list_roblox_processes(app: AppHandle) -> CommandResponse<Vec<RobloxProcessInfo>> {
    run_blocking_command(move || list_roblox_processes_operation(&app)).await
}

/// Kills a specific Roblox process by PID.
#[command]
pub async fn kill_roblox_process(app: AppHandle, pid: u32) -> CommandResponse<()> {
    run_blocking_command(move || kill_roblox_process_operation(&app, pid)).await
}

/// Gets the currently logged-in Roblox account from the live client.
#[command]
pub async fn get_live_roblox_account(
    app: AppHandle,
) -> CommandResponse<Option<RobloxAccountIdentity>> {
    get_live_roblox_account_operation(&app)
        .await
        .map_err(format_command_error)
}
