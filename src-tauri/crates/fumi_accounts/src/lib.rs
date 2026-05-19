//! Roblox account management, cookie parsing, process tracking, and persistence.

mod binarycookies;
pub mod models;
mod process;
mod roblox;
pub mod storage;

pub use models::{AccountListResponse, AccountSummary, RobloxAccountIdentity, RobloxProcessInfo};
pub use roblox::resolve_account_from_cookie;
pub use storage::{
    delete_account, kill_roblox_process, kill_roblox_processes, launch_account, launch_roblox,
    get_live_roblox_account, list_accounts, list_executor_port_summaries, list_roblox_processes,
    list_roblox_processes_with_bindings, normalize_cookie_value, upsert_account, LaunchOutcome,
    ROBLOX_APPLICATION_PATH, ROBLOX_BINARYCOOKIES_RELATIVE_PATH,
};
