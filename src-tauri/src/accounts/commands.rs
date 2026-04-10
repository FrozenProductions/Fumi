use tauri::{command, AppHandle};

use crate::accounts::models::{AccountListResponse, AccountSummary, RobloxProcessInfo};
use crate::accounts::{
    add_account as add_account_operation, delete_account as delete_account_operation,
    kill_roblox_process as kill_roblox_process_operation,
    kill_roblox_processes as kill_roblox_processes_operation,
    launch_account as launch_account_operation, launch_roblox as launch_roblox_operation,
    list_accounts as list_accounts_operation,
    list_roblox_processes as list_roblox_processes_operation,
};
use crate::command::{format_command_error, run_command, CommandResponse};

#[command]
pub fn list_accounts(app: AppHandle) -> CommandResponse<AccountListResponse> {
    run_command(|| list_accounts_operation(&app))
}

#[command]
pub async fn add_account(app: AppHandle, cookie: String) -> CommandResponse<AccountSummary> {
    add_account_operation(&app, &cookie)
        .await
        .map_err(format_command_error)
}

#[command]
pub fn launch_account(app: AppHandle, account_id: String) -> CommandResponse<AccountSummary> {
    run_command(|| launch_account_operation(&app, &account_id))
}

#[command]
pub fn delete_account(app: AppHandle, account_id: String) -> CommandResponse<()> {
    run_command(|| delete_account_operation(&app, &account_id))
}

#[command]
pub fn kill_roblox_processes() -> CommandResponse<()> {
    run_command(kill_roblox_processes_operation)
}

#[command]
pub fn launch_roblox() -> CommandResponse<()> {
    run_command(launch_roblox_operation)
}

#[command]
pub fn list_roblox_processes() -> CommandResponse<Vec<RobloxProcessInfo>> {
    run_command(list_roblox_processes_operation)
}

#[command]
pub fn kill_roblox_process(pid: u32) -> CommandResponse<()> {
    run_command(|| kill_roblox_process_operation(pid))
}
