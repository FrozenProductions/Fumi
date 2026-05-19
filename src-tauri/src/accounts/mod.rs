//! Tauri shell adapters for account management.

pub(crate) mod commands;

pub(crate) mod models {
    pub(crate) use fumi_accounts::models::*;
}

use std::path::PathBuf;

use anyhow::{Context, Result};
use tauri::{AppHandle, Manager, Runtime};

use fumi_accounts::{
    AccountListResponse, AccountSummary, RobloxAccountIdentity, RobloxProcessInfo,
};
use fumi_executor_core::{current_executor_port_pool, ExecutorPortPool, ExecutorPortSummary};

use crate::executor;

fn accounts_root<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf> {
    Ok(app
        .path()
        .app_local_data_dir()
        .context("failed to resolve the app local data directory")?
        .join(fumi_accounts::models::ACCOUNTS_DIR_NAME))
}

fn roblox_user_agent<R: Runtime>(app: &AppHandle<R>) -> String {
    format!("Fumi/{}", app.package_info().version)
}

pub(crate) fn list_accounts<R: Runtime>(app: &AppHandle<R>) -> Result<AccountListResponse> {
    let root = accounts_root(app)?;
    let executor_port_pool = current_executor_port_pool();
    fumi_accounts::list_accounts(&root, &executor_port_pool)
}

pub(crate) async fn add_account<R: Runtime>(
    app: &AppHandle<R>,
    cookie: &str,
) -> Result<AccountSummary> {
    let normalized_cookie = fumi_accounts::normalize_cookie_value(cookie)?;
    let resolved_account =
        fumi_accounts::resolve_account_from_cookie(&roblox_user_agent(app), &normalized_cookie)
            .await?;
    let root = accounts_root(app)?;
    let executor_port_pool = current_executor_port_pool();

    fumi_accounts::upsert_account(
        &root,
        &executor_port_pool,
        &resolved_account,
        &normalized_cookie,
    )
}

pub(crate) fn launch_account<R: Runtime>(
    app: &AppHandle<R>,
    account_id: &str,
) -> Result<AccountSummary> {
    let root = accounts_root(app)?;
    let live_cookie_path = fumi_accounts::storage::get_live_roblox_cookie_path()?;
    let executor_port_pool = current_executor_port_pool();
    let outcome =
        fumi_accounts::launch_account(&root, &live_cookie_path, &executor_port_pool, account_id)?;

    if let Some(port) = outcome.selected_port {
        let _ = executor::select_current_executor_port(app, port)?;
    }

    outcome
        .summary
        .context("account launch did not return an account summary")
}

pub(crate) fn delete_account<R: Runtime>(app: &AppHandle<R>, account_id: &str) -> Result<()> {
    let root = accounts_root(app)?;
    let executor_port_pool = current_executor_port_pool();
    fumi_accounts::delete_account(&root, &executor_port_pool, account_id)?;
    let _ = executor::emit_current_executor_status(app)?;
    Ok(())
}

pub(crate) fn kill_roblox_processes<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
    fumi_accounts::kill_roblox_processes()?;
    let _ = executor::emit_current_executor_status(app)?;
    Ok(())
}

pub(crate) fn launch_roblox<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
    let root = accounts_root(app)?;
    let executor_port_pool = current_executor_port_pool();
    let outcome = fumi_accounts::launch_roblox(&root, &executor_port_pool)?;

    if let Some(port) = outcome.selected_port {
        let _ = executor::select_current_executor_port(app, port)?;
    }

    Ok(())
}

pub(crate) fn list_roblox_processes_with_bindings<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<Vec<RobloxProcessInfo>> {
    let root = accounts_root(app)?;
    let executor_port_pool = current_executor_port_pool();
    fumi_accounts::list_roblox_processes_with_bindings(&root, &executor_port_pool)
}

pub(crate) async fn get_live_roblox_account<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<Option<RobloxAccountIdentity>> {
    let live_cookie_path = fumi_accounts::storage::get_live_roblox_cookie_path()?;
    fumi_accounts::get_live_roblox_account(&live_cookie_path, &roblox_user_agent(app)).await
}

pub(crate) fn kill_roblox_process<R: Runtime>(app: &AppHandle<R>, pid: u32) -> Result<()> {
    fumi_accounts::kill_roblox_process(pid)?;
    let _ = executor::emit_current_executor_status(app)?;
    Ok(())
}

pub(crate) fn list_executor_port_summaries<R: Runtime>(
    app: &AppHandle<R>,
    executor_port_pool: &ExecutorPortPool,
) -> Result<Vec<ExecutorPortSummary>> {
    let root = accounts_root(app)?;
    fumi_accounts::list_executor_port_summaries(&root, executor_port_pool)
}
