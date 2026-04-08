use tauri::{command, AppHandle};

use crate::accounts::models::{AccountListResponse, AccountSummary};
use crate::accounts::{
    add_account as add_account_operation, delete_account as delete_account_operation,
    launch_account as launch_account_operation, list_accounts as list_accounts_operation,
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
