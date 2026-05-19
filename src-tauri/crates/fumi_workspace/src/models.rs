//! Data models for workspace tabs, split views, snapshots, and metadata.

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use fumi_executor_core::ExecutorKind;
use fumi_metadata::{MetadataHeader, CURRENT_WORKSPACE_METADATA_VERSION};

pub const WORKSPACE_METADATA_DIR_NAME: &str = ".fumi";
pub const WORKSPACE_METADATA_FILE_NAME: &str = "workspace.json";
pub const APP_STATE_FILE_NAME: &str = "state.json";
pub const DEFAULT_WORKSPACE_FILE_BASE_NAME: &str = "script";
pub const DEFAULT_WORKSPACE_FILE_EXTENSION: &str = ".lua";
pub const MAX_WORKSPACE_TAB_NAME_LENGTH: usize = 20;
pub const WORKSPACE_MISSING_ERROR_MESSAGE: &str = "Workspace not found.";
pub const LEGACY_STATE_DIRECTORIES: [&str; 2] = ["Fumi", "frozenproductions.fumi"];
pub const WORKSPACE_METADATA_VERSION: u8 = CURRENT_WORKSPACE_METADATA_VERSION;
pub const MAX_WORKSPACE_EXECUTION_HISTORY_ENTRIES: usize = 100;

/// Cursor position and scroll state for a workspace editor tab.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceCursorState {
    pub line: i64,
    pub column: i64,
    pub scroll_top: f64,
}

/// Persistent state for a workspace tab, including its cursor position and archive status.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceTabState {
    pub id: String,
    pub file_name: String,
    pub cursor: WorkspaceCursorState,
    #[serde(default)]
    pub is_pinned: bool,
    #[serde(default)]
    pub archived_at: Option<i64>,
}

/// A workspace tab snapshot including its file content and dirty state.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceTabSnapshot {
    pub id: String,
    pub file_name: String,
    pub cursor: WorkspaceCursorState,
    #[serde(default)]
    pub is_pinned: bool,
    pub content: String,
    pub is_dirty: bool,
}

/// Identifies which pane (primary or secondary) is focused in a split view.
pub type WorkspaceSplitView = Value;

/// Full workspace metadata including tabs, archived tabs, and execution history.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
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

/// Complete workspace snapshot sent to the frontend on bootstrap, open, and refresh.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSnapshot {
    pub workspace_path: String,
    pub workspace_name: String,
    pub metadata: WorkspaceMetadata,
    pub tabs: Vec<WorkspaceTabSnapshot>,
}

/// Response returned when bootstrapping the workspace, containing the last session if available.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceBootstrapResponse {
    pub last_workspace_path: Option<String>,
    pub workspace: Option<WorkspaceSnapshot>,
}

/// A file name and content pair for a script dropped into the workspace from outside the app.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct DroppedWorkspaceScriptDraft {
    pub file_name: String,
    pub content: String,
}

/// A single execution history entry recording when and where a script was executed.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
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
pub struct StoredAppState {
    pub last_workspace_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct StoredWorkspaceMetadata {
    pub version: u8,
    pub active_tab_id: Option<String>,
    #[serde(default)]
    pub split_view: Option<WorkspaceSplitView>,
    pub tabs: Option<Vec<WorkspaceTabState>>,
    pub archived_tabs: Option<Vec<WorkspaceTabState>>,
    #[serde(default)]
    pub execution_history: Option<Vec<WorkspaceExecutionHistoryEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct PersistedWorkspaceDocumentV1 {
    pub version: u8,
    pub active_tab_id: Option<String>,
    #[serde(default)]
    pub tabs: Option<Vec<WorkspaceTabState>>,
    #[serde(flatten, default)]
    pub extra_fields: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct PersistedWorkspaceDocumentV2 {
    pub version: u8,
    pub active_tab_id: Option<String>,
    #[serde(default)]
    pub tabs: Option<Vec<WorkspaceTabState>>,
    #[serde(default)]
    pub archived_tabs: Option<Vec<WorkspaceTabState>>,
    #[serde(flatten, default)]
    pub extra_fields: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct PersistedWorkspaceDocumentV3 {
    pub version: u8,
    pub active_tab_id: Option<String>,
    #[serde(default)]
    pub split_view: Option<WorkspaceSplitView>,
    #[serde(default)]
    pub tabs: Option<Vec<WorkspaceTabState>>,
    #[serde(default)]
    pub archived_tabs: Option<Vec<WorkspaceTabState>>,
    #[serde(flatten, default)]
    pub extra_fields: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct PersistedWorkspaceDocumentV4 {
    pub version: u8,
    pub active_tab_id: Option<String>,
    #[serde(default)]
    pub split_view: Option<WorkspaceSplitView>,
    #[serde(default)]
    pub tabs: Option<Vec<WorkspaceTabState>>,
    #[serde(default)]
    pub archived_tabs: Option<Vec<WorkspaceTabState>>,
    #[serde(default)]
    pub execution_history: Option<Vec<WorkspaceExecutionHistoryEntry>>,
    #[serde(flatten, default)]
    pub extra_fields: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PersistedWorkspaceDocumentV5 {
    #[serde(flatten)]
    pub header: MetadataHeader,
    #[serde(default)]
    pub active_tab_id: Option<String>,
    #[serde(default)]
    pub split_view: Option<WorkspaceSplitView>,
    pub tabs: Vec<WorkspaceTabState>,
    pub archived_tabs: Vec<WorkspaceTabState>,
    pub execution_history: Vec<WorkspaceExecutionHistoryEntry>,
    #[serde(flatten, default)]
    pub extra_fields: Map<String, Value>,
}

impl PersistedWorkspaceDocumentV5 {
    pub fn into_runtime(self) -> WorkspaceMetadata {
        WorkspaceMetadata {
            version: self.header.version,
            active_tab_id: self.active_tab_id,
            split_view: self.split_view,
            tabs: self.tabs,
            archived_tabs: self.archived_tabs,
            execution_history: self.execution_history,
        }
    }

    pub fn from_runtime(
        metadata: WorkspaceMetadata,
        header: MetadataHeader,
        extra_fields: Map<String, Value>,
    ) -> Self {
        Self {
            header,
            active_tab_id: metadata.active_tab_id,
            split_view: metadata.split_view,
            tabs: metadata.tabs,
            archived_tabs: metadata.archived_tabs,
            execution_history: metadata.execution_history,
            extra_fields,
        }
    }
}
