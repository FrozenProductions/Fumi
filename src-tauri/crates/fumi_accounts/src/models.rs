//! Data models for accounts, Roblox process info, and API responses.

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use fumi_metadata::{registry::ACCOUNTS_METADATA_VERSION, MetadataHeader};

pub const ACCOUNTS_DIR_NAME: &str = "accounts";
pub const ACCOUNTS_MANIFEST_FILE_NAME: &str = "accounts.json";
pub const ACCOUNTS_COOKIES_DIR_NAME: &str = "cookies";
pub const ACCOUNTS_MANIFEST_VERSION: u8 = ACCOUNTS_METADATA_VERSION;

/// Whether an account is currently active (bound to a running process) or offline.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AccountStatus {
    Active,
    Offline,
}

/// Summary of a Roblox account including its current active status and bound executor port.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AccountSummary {
    pub id: String,
    pub user_id: i64,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub status: AccountStatus,
    pub bound_port: Option<u16>,
    pub last_launched_at: Option<i64>,
}

/// Response containing the list of accounts and whether Roblox is running.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AccountListResponse {
    pub accounts: Vec<AccountSummary>,
    pub is_roblox_running: bool,
}

/// Information about a running Roblox process, including its bound account.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RobloxProcessInfo {
    pub pid: u32,
    pub started_at: i64,
    pub bound_account_id: Option<String>,
    pub bound_account_display_name: Option<String>,
    pub is_bound_to_unknown_account: bool,
}

/// Identity details for a Roblox account resolved from an authentication cookie.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RobloxAccountIdentity {
    pub user_id: i64,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedRobloxAccount {
    pub user_id: i64,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
}

impl ResolvedRobloxAccount {
    pub fn into_identity(self) -> RobloxAccountIdentity {
        RobloxAccountIdentity {
            user_id: self.user_id,
            username: self.username,
            display_name: self.display_name,
            avatar_url: self.avatar_url,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StoredAccountRecord {
    pub id: String,
    pub user_id: i64,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub cookie_file_name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub last_launched_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StoredRobloxBindingRecord {
    pub pid: u32,
    pub started_at: i64,
    pub port: u16,
    pub account_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StoredAccountsManifest {
    pub version: u8,
    pub accounts: Vec<StoredAccountRecord>,
    pub roblox_bindings: Vec<StoredRobloxBindingRecord>,
}

impl Default for StoredAccountsManifest {
    fn default() -> Self {
        Self {
            version: ACCOUNTS_MANIFEST_VERSION,
            accounts: Vec::new(),
            roblox_bindings: Vec::new(),
        }
    }
}

impl StoredAccountRecord {
    pub fn to_summary(&self, bound_port: Option<u16>) -> AccountSummary {
        AccountSummary {
            id: self.id.clone(),
            user_id: self.user_id,
            username: self.username.clone(),
            display_name: self.display_name.clone(),
            avatar_url: self.avatar_url.clone(),
            status: if bound_port.is_some() {
                AccountStatus::Active
            } else {
                AccountStatus::Offline
            },
            bound_port,
            last_launched_at: self.last_launched_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PersistedAccountsDocumentV1 {
    pub version: u8,
    pub active_account_id: Option<String>,
    pub accounts: Vec<StoredAccountRecord>,
    #[serde(flatten, default)]
    pub extra_fields: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PersistedAccountsDocumentV2 {
    pub version: u8,
    pub accounts: Vec<StoredAccountRecord>,
    pub roblox_bindings: Vec<StoredRobloxBindingRecord>,
    #[serde(flatten, default)]
    pub extra_fields: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PersistedAccountsDocumentV3 {
    #[serde(flatten)]
    pub header: MetadataHeader,
    pub accounts: Vec<StoredAccountRecord>,
    pub roblox_bindings: Vec<StoredRobloxBindingRecord>,
    #[serde(flatten, default)]
    pub extra_fields: Map<String, Value>,
}

impl PersistedAccountsDocumentV3 {
    pub fn into_runtime(self) -> StoredAccountsManifest {
        StoredAccountsManifest {
            version: self.header.version,
            accounts: self.accounts,
            roblox_bindings: self.roblox_bindings,
        }
    }

    pub fn from_runtime(
        manifest: StoredAccountsManifest,
        header: MetadataHeader,
        extra_fields: Map<String, Value>,
    ) -> Self {
        Self {
            header,
            accounts: manifest.accounts,
            roblox_bindings: manifest.roblox_bindings,
            extra_fields,
        }
    }
}
