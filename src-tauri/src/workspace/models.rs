use serde::{Deserialize, Serialize};

pub(super) const WORKSPACE_METADATA_DIR_NAME: &str = ".fumi";
pub(super) const WORKSPACE_METADATA_FILE_NAME: &str = "workspace.json";
pub(super) const APP_STATE_FILE_NAME: &str = "state.json";
pub(super) const DEFAULT_WORKSPACE_FILE_BASE_NAME: &str = "script";
pub(super) const DEFAULT_WORKSPACE_FILE_EXTENSION: &str = ".lua";
pub(super) const MAX_WORKSPACE_TAB_NAME_LENGTH: usize = 20;
pub(super) const WORKSPACE_MISSING_ERROR_MESSAGE: &str = "Workspace not found.";
pub(super) const LEGACY_STATE_DIRECTORIES: [&str; 2] = ["Fumi", "frozenproductions.fumi"];

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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceMetadata {
    pub version: u8,
    pub active_tab_id: Option<String>,
    pub tabs: Vec<WorkspaceTabState>,
    pub archived_tabs: Vec<WorkspaceTabState>,
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
pub(super) struct StoredAppState {
    pub(super) last_workspace_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct StoredWorkspaceMetadata {
    pub(super) version: u8,
    pub(super) active_tab_id: Option<String>,
    pub(super) tabs: Option<Vec<WorkspaceTabState>>,
    pub(super) archived_tabs: Option<Vec<WorkspaceTabState>>,
}
