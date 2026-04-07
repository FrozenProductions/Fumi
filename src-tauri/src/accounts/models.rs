use serde::{Deserialize, Serialize};

pub(super) const ACCOUNTS_DIR_NAME: &str = "accounts";
pub(super) const ACCOUNTS_MANIFEST_FILE_NAME: &str = "accounts.json";
pub(super) const ACCOUNTS_COOKIES_DIR_NAME: &str = "cookies";
pub(super) const ACCOUNTS_MANIFEST_VERSION: u8 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AccountStatus {
    Active,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AccountSummary {
    pub id: String,
    pub user_id: i64,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub status: AccountStatus,
    pub last_launched_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AccountListResponse {
    pub accounts: Vec<AccountSummary>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct ResolvedRobloxAccount {
    pub(super) user_id: i64,
    pub(super) username: String,
    pub(super) display_name: String,
    pub(super) avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(super) struct StoredAccountRecord {
    pub(super) id: String,
    pub(super) user_id: i64,
    pub(super) username: String,
    pub(super) display_name: String,
    pub(super) avatar_url: Option<String>,
    pub(super) cookie_file_name: String,
    pub(super) created_at: i64,
    pub(super) updated_at: i64,
    pub(super) last_launched_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(super) struct StoredAccountsManifest {
    pub(super) version: u8,
    pub(super) active_account_id: Option<String>,
    pub(super) accounts: Vec<StoredAccountRecord>,
}

impl Default for StoredAccountsManifest {
    fn default() -> Self {
        Self {
            version: ACCOUNTS_MANIFEST_VERSION,
            active_account_id: None,
            accounts: Vec::new(),
        }
    }
}

impl StoredAccountRecord {
    pub(super) fn to_summary(
        &self,
        active_account_id: Option<&str>,
        is_roblox_running: bool,
    ) -> AccountSummary {
        AccountSummary {
            id: self.id.clone(),
            user_id: self.user_id,
            username: self.username.clone(),
            display_name: self.display_name.clone(),
            avatar_url: self.avatar_url.clone(),
            status: match active_account_id {
                Some(active_id) if active_id == self.id && is_roblox_running => {
                    AccountStatus::Active
                }
                _ => AccountStatus::Offline,
            },
            last_launched_at: self.last_launched_at,
        }
    }
}
