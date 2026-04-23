//! Schema registry and version constants for metadata documents.

use anyhow::{Context, Result};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[cfg(test)]
pub(crate) const CURRENT_SCHEMA_DRAFT: &str = "https://json-schema.org/draft/2020-12/schema";
pub(crate) const CURRENT_APP_VERSION: &str = env!("CARGO_PKG_VERSION");
pub(crate) const CURRENT_WORKSPACE_METADATA_VERSION: u8 = 5;
pub(crate) const AUTOMATIC_EXECUTION_METADATA_VERSION: u8 = 2;
pub(crate) const ACCOUNTS_METADATA_VERSION: u8 = 3;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub(crate) enum MetadataKind {
    Workspace,
    AutomaticExecution,
    Accounts,
}

impl std::fmt::Display for MetadataKind {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let label = match self {
            Self::Workspace => "workspace",
            Self::AutomaticExecution => "automatic_execution",
            Self::Accounts => "accounts",
        };

        formatter.write_str(label)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MetadataHeader {
    #[serde(rename = "$schema")]
    pub schema: String,
    pub kind: MetadataKind,
    pub version: u8,
    pub created_at: i64,
    pub updated_at: i64,
    #[serde(default)]
    pub migrated_from_version: Option<u8>,
    pub written_by_app_version: String,
}

impl MetadataHeader {
    pub(crate) fn new(
        kind: MetadataKind,
        version: u8,
        created_at: i64,
        updated_at: i64,
        migrated_from_version: Option<u8>,
    ) -> Self {
        Self {
            schema: metadata_schema_id(kind, version).to_string(),
            kind,
            version,
            created_at,
            updated_at,
            migrated_from_version,
            written_by_app_version: CURRENT_APP_VERSION.to_string(),
        }
    }
}

pub(crate) fn metadata_schema_id(kind: MetadataKind, version: u8) -> &'static str {
    match (kind, version) {
        (MetadataKind::Workspace, CURRENT_WORKSPACE_METADATA_VERSION) => {
            "https://fumi.app/schemas/workspace.v5.schema.json"
        }
        (MetadataKind::AutomaticExecution, AUTOMATIC_EXECUTION_METADATA_VERSION) => {
            "https://fumi.app/schemas/automatic-execution.v2.schema.json"
        }
        (MetadataKind::Accounts, ACCOUNTS_METADATA_VERSION) => {
            "https://fumi.app/schemas/accounts.v3.schema.json"
        }
        (MetadataKind::Workspace, _) => "https://fumi.app/schemas/workspace.schema.json",
        (MetadataKind::AutomaticExecution, _) => {
            "https://fumi.app/schemas/automatic-execution.schema.json"
        }
        (MetadataKind::Accounts, _) => "https://fumi.app/schemas/accounts.schema.json",
    }
}

pub(crate) fn current_unix_timestamp() -> Result<i64> {
    Ok(std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .context("system clock is before unix epoch")?
        .as_secs()
        .try_into()
        .context("timestamp exceeds i64")?)
}
