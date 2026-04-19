use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::metadata::{registry::ACCOUNTS_METADATA_VERSION, MetadataHeader};

pub(super) const ACCOUNTS_DIR_NAME: &str = "accounts";
pub(super) const ACCOUNTS_MANIFEST_FILE_NAME: &str = "accounts.json";
pub(super) const ACCOUNTS_COOKIES_DIR_NAME: &str = "cookies";
pub(super) const ACCOUNTS_MANIFEST_VERSION: u8 = ACCOUNTS_METADATA_VERSION;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AccountStatus {
    Active,
    Offline,
}

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

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AccountListResponse {
    pub accounts: Vec<AccountSummary>,
    pub is_roblox_running: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RobloxProcessInfo {
    pub pid: u32,
    pub started_at: i64,
    pub bound_account_id: Option<String>,
    pub bound_account_display_name: Option<String>,
    pub is_bound_to_unknown_account: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RobloxAccountIdentity {
    pub user_id: i64,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct ResolvedRobloxAccount {
    pub(super) user_id: i64,
    pub(super) username: String,
    pub(super) display_name: String,
    pub(super) avatar_url: Option<String>,
}

impl ResolvedRobloxAccount {
    pub(super) fn into_identity(self) -> RobloxAccountIdentity {
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

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(super) struct StoredRobloxBindingRecord {
    pub(super) pid: u32,
    pub(super) started_at: i64,
    pub(super) port: u16,
    pub(super) account_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(super) struct StoredAccountsManifest {
    pub(super) version: u8,
    pub(super) accounts: Vec<StoredAccountRecord>,
    pub(super) roblox_bindings: Vec<StoredRobloxBindingRecord>,
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
    pub(super) fn to_summary(&self, bound_port: Option<u16>) -> AccountSummary {
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
            bound_port: bound_port,
            last_launched_at: self.last_launched_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PersistedAccountsDocumentV1 {
    pub(super) version: u8,
    pub(super) active_account_id: Option<String>,
    pub(super) accounts: Vec<StoredAccountRecord>,
    #[serde(flatten, default)]
    pub(super) extra_fields: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PersistedAccountsDocumentV2 {
    pub(super) version: u8,
    pub(super) accounts: Vec<StoredAccountRecord>,
    pub(super) roblox_bindings: Vec<StoredRobloxBindingRecord>,
    #[serde(flatten, default)]
    pub(super) extra_fields: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PersistedAccountsDocumentV3 {
    #[serde(flatten)]
    pub(super) header: MetadataHeader,
    #[serde(default)]
    pub(super) accounts: Vec<StoredAccountRecord>,
    #[serde(default)]
    pub(super) roblox_bindings: Vec<StoredRobloxBindingRecord>,
    #[serde(flatten, default)]
    pub(super) extra_fields: Map<String, Value>,
}

impl PersistedAccountsDocumentV3 {
    pub(super) fn into_runtime(self) -> StoredAccountsManifest {
        StoredAccountsManifest {
            version: self.header.version,
            accounts: self.accounts,
            roblox_bindings: self.roblox_bindings,
        }
    }

    pub(super) fn from_runtime(
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
