use serde::{Deserialize, Serialize};

use crate::executor::ExecutorKind;

pub(super) const AUTOMATIC_EXECUTION_METADATA_DIR_NAME: &str = ".fumi";
pub(super) const AUTOMATIC_EXECUTION_METADATA_FILE_NAME: &str =
    "automatic-execution.json";
pub(super) const DEFAULT_AUTOMATIC_EXECUTION_FILE_BASE_NAME: &str = "script";
pub(super) const DEFAULT_AUTOMATIC_EXECUTION_FILE_EXTENSION: &str = ".lua";
pub(super) const MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH: usize = 20;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionCursorState {
    pub line: i64,
    pub column: i64,
    pub scroll_top: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionScriptState {
    pub id: String,
    pub file_name: String,
    pub cursor: AutomaticExecutionCursorState,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionScriptSnapshot {
    pub id: String,
    pub file_name: String,
    pub cursor: AutomaticExecutionCursorState,
    pub content: String,
    pub is_dirty: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionMetadata {
    pub version: u8,
    pub active_script_id: Option<String>,
    pub scripts: Vec<AutomaticExecutionScriptState>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaticExecutionSnapshot {
    pub executor_kind: ExecutorKind,
    pub resolved_path: String,
    pub metadata: AutomaticExecutionMetadata,
    pub scripts: Vec<AutomaticExecutionScriptSnapshot>,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(super) struct StoredAutomaticExecutionMetadata {
    pub(super) version: u8,
    pub(super) active_script_id: Option<String>,
    pub(super) scripts: Option<Vec<AutomaticExecutionScriptState>>,
}
