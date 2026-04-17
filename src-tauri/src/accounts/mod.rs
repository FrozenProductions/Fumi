pub(crate) mod commands;
pub(crate) mod models;

mod roblox;
pub(crate) mod storage;

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
    storage::launch_account(app, account_id)
}

pub(crate) fn delete_account<R: Runtime>(app: &AppHandle<R>, account_id: &str) -> Result<()> {
    storage::delete_account(app, account_id)
}

pub(crate) fn kill_roblox_processes<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
    storage::kill_roblox_processes(app)
}

pub(crate) fn launch_roblox<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
    storage::launch_roblox(app)
}

pub(crate) fn list_roblox_processes() -> Result<Vec<RobloxProcessInfo>> {
    storage::list_roblox_processes()
}

pub(crate) fn kill_roblox_process<R: Runtime>(app: &AppHandle<R>, pid: u32) -> Result<()> {
    storage::kill_roblox_process(app, pid)
}
