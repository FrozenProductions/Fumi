//! Data models for automatic execution scripts, metadata, and snapshots.

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::executor::ExecutorKind;
use crate::metadata::MetadataHeader;

pub(super) const AUTOMATIC_EXECUTION_METADATA_DIR_NAME: &str = ".fumi";
pub(super) const AUTOMATIC_EXECUTION_METADATA_FILE_NAME: &str = "automatic-execution.json";
pub(super) const DEFAULT_AUTOMATIC_EXECUTION_FILE_BASE_NAME: &str = "script";
pub(super) const DEFAULT_AUTOMATIC_EXECUTION_FILE_EXTENSION: &str = ".lua";
pub(super) const MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH: usize = 20;

/// Cursor position and scroll state for an automatic execution script editor.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionCursorState {
    pub line: i64,
    pub column: i64,
    pub scroll_top: f64,
}

/// Persistent state for an automatic execution script tab.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionScriptState {
    pub id: String,
    pub file_name: String,
    pub cursor: AutomaticExecutionCursorState,
}

/// A script snapshot including its file content and dirty state.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionScriptSnapshot {
    pub id: String,
    pub file_name: String,
    pub cursor: AutomaticExecutionCursorState,
    pub content: String,
    pub is_dirty: bool,
}

/// Metadata for the automatic execution system including active script and script list.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionMetadata {
    pub version: u8,
    pub active_script_id: Option<String>,
    pub scripts: Vec<AutomaticExecutionScriptState>,
}

/// Full automatic execution snapshot sent to the frontend on bootstrap and refresh.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionSnapshot {
    pub executor_kind: ExecutorKind,
    pub resolved_path: String,
    pub metadata: AutomaticExecutionMetadata,
    pub scripts: Vec<AutomaticExecutionScriptSnapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(super) struct StoredAutomaticExecutionMetadata {
    pub(super) version: u8,
    pub(super) active_script_id: Option<String>,
    pub(super) scripts: Option<Vec<AutomaticExecutionScriptState>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PersistedAutomaticExecutionDocumentV1 {
    pub(super) version: u8,
    pub(super) active_script_id: Option<String>,
    #[serde(default)]
    pub(super) scripts: Option<Vec<AutomaticExecutionScriptState>>,
    #[serde(flatten, default)]
    pub(super) extra_fields: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PersistedAutomaticExecutionDocumentV2 {
    #[serde(flatten)]
    pub(super) header: MetadataHeader,
    #[serde(default)]
    pub(super) active_script_id: Option<String>,
    pub(super) scripts: Vec<AutomaticExecutionScriptState>,
    #[serde(flatten, default)]
    pub(super) extra_fields: Map<String, Value>,
}

impl PersistedAutomaticExecutionDocumentV2 {
    pub(super) fn into_runtime(self) -> AutomaticExecutionMetadata {
        AutomaticExecutionMetadata {
            version: self.header.version,
            active_script_id: self.active_script_id,
            scripts: self.scripts,
        }
    }

    pub(super) fn from_runtime(
        metadata: AutomaticExecutionMetadata,
        header: MetadataHeader,
        extra_fields: Map<String, Value>,
    ) -> Self {
        Self {
            header,
            active_script_id: metadata.active_script_id,
            scripts: metadata.scripts,
            extra_fields,
        }
    }
}
