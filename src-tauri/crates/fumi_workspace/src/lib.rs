//! Workspace models, metadata persistence, archive handling, and app-state IO.

pub mod models;
pub mod storage;

pub use models::{
    DroppedWorkspaceScriptDraft, WorkspaceBootstrapResponse, WorkspaceCursorState,
    WorkspaceExecutionHistoryEntry, WorkspaceMetadata, WorkspaceSnapshot, WorkspaceSplitView,
    WorkspaceTabSnapshot, WorkspaceTabState,
};
