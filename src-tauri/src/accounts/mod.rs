pub(crate) mod commands;
pub(crate) mod models;

mod roblox;
mod storage;

use anyhow::Result;
use tauri::{AppHandle, Runtime};

use self::models::{AccountListResponse, AccountSummary, RobloxProcessInfo};

pub(crate) fn list_accounts<R: Runtime>(app: &AppHandle<R>) -> Result<AccountListResponse> {
    storage::list_accounts(app)
}

pub(crate) async fn add_account<R: Runtime>(
    app: &AppHandle<R>,
    cookie: &str,
) -> Result<AccountSummary> {
    let normalized_cookie = storage::normalize_cookie_value(cookie)?;
    let resolved_account = roblox::resolve_account_from_cookie(app, &normalized_cookie).await?;

    storage::upsert_account(app, &resolved_account, &normalized_cookie)
}

pub(crate) fn launch_account<R: Runtime>(
    app: &AppHandle<R>,
    account_id: &str,
) -> Result<AccountSummary> {
    storage::activate_account(app, account_id)
}

pub(crate) fn delete_account<R: Runtime>(app: &AppHandle<R>, account_id: &str) -> Result<()> {
    storage::delete_account(app, account_id)
}

pub(crate) fn kill_roblox_processes() -> Result<()> {
    storage::kill_roblox_processes()
}

pub(crate) fn launch_roblox() -> Result<()> {
    storage::launch_roblox_application(std::path::Path::new(storage::ROBLOX_APPLICATION_PATH))
}

pub(crate) fn list_roblox_processes() -> Result<Vec<RobloxProcessInfo>> {
    storage::list_roblox_processes()
}

pub(crate) fn kill_roblox_process(pid: u32) -> Result<()> {
    storage::kill_roblox_process(pid)
}
