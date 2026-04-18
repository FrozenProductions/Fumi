use serde::{Deserialize, Serialize};

use crate::executor::ExecutorKind;

pub(super) const WORKSPACE_METADATA_DIR_NAME: &str = ".fumi";
pub(super) const WORKSPACE_METADATA_FILE_NAME: &str = "workspace.json";
pub(super) const APP_STATE_FILE_NAME: &str = "state.json";
pub(super) const DEFAULT_WORKSPACE_FILE_BASE_NAME: &str = "script";
pub(super) const DEFAULT_WORKSPACE_FILE_EXTENSION: &str = ".lua";
pub(super) const MAX_WORKSPACE_TAB_NAME_LENGTH: usize = 20;
pub(super) const WORKSPACE_MISSING_ERROR_MESSAGE: &str = "Workspace not found.";
pub(super) const LEGACY_STATE_DIRECTORIES: [&str; 2] = ["Fumi", "frozenproductions.fumi"];
pub(super) const DEFAULT_WORKSPACE_SPLIT_RATIO: f64 = 0.5;
pub(super) const MIN_WORKSPACE_SPLIT_RATIO: f64 = 0.12;
pub(super) const MAX_WORKSPACE_SPLIT_RATIO: f64 = 0.88;
pub(super) const WORKSPACE_METADATA_VERSION: u8 = 4;
pub(super) const MAX_WORKSPACE_EXECUTION_HISTORY_ENTRIES: usize = 100;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceCursorState {
    pub line: i64,
    pub column: i64,
    pub scroll_top: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceTabState {
    pub id: String,
    pub file_name: String,
    pub cursor: WorkspaceCursorState,
    #[serde(default)]
    pub archived_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceTabSnapshot {
    pub id: String,
    pub file_name: String,
    pub cursor: WorkspaceCursorState,
    pub content: String,
    pub is_dirty: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum WorkspacePaneId {
    Primary,
    Secondary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSplitView {
    pub direction: String,
    pub primary_tab_id: String,
    pub secondary_tab_id: String,
    #[serde(default)]
    pub secondary_tab_ids: Vec<String>,
    #[serde(default = "default_workspace_split_ratio")]
    pub split_ratio: f64,
    pub focused_pane: WorkspacePaneId,
}

fn default_workspace_split_ratio() -> f64 {
    DEFAULT_WORKSPACE_SPLIT_RATIO
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceMetadata {
    pub version: u8,
    pub active_tab_id: Option<String>,
    #[serde(default)]
    pub split_view: Option<WorkspaceSplitView>,
    pub tabs: Vec<WorkspaceTabState>,
    pub archived_tabs: Vec<WorkspaceTabState>,
    #[serde(default)]
    pub execution_history: Vec<WorkspaceExecutionHistoryEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSnapshot {
    pub workspace_path: String,
    pub workspace_name: String,
    pub metadata: WorkspaceMetadata,
    pub tabs: Vec<WorkspaceTabSnapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceBootstrapResponse {
    pub last_workspace_path: Option<String>,
    pub workspace: Option<WorkspaceSnapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DroppedWorkspaceScriptDraft {
    pub file_name: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceExecutionHistoryEntry {
    pub id: String,
    pub executed_at: i64,
    pub executor_kind: ExecutorKind,
    pub port: u16,
    pub account_id: Option<String>,
    pub account_display_name: Option<String>,
    pub is_bound_to_unknown_account: bool,
    pub file_name: String,
    pub script_content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct StoredAppState {
    pub(super) last_workspace_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct StoredWorkspaceMetadata {
    pub(super) version: u8,
    pub(super) active_tab_id: Option<String>,
    #[serde(default)]
    pub(super) split_view: Option<WorkspaceSplitView>,
    pub(super) tabs: Option<Vec<WorkspaceTabState>>,
    pub(super) archived_tabs: Option<Vec<WorkspaceTabState>>,
    #[serde(default)]
    pub(super) execution_history: Option<Vec<WorkspaceExecutionHistoryEntry>>,
}
