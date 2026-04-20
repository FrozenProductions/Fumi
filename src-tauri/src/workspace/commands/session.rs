use std::path::{Path, PathBuf};

use anyhow::Context;
use tauri::{command, AppHandle};

use super::super::{
    models::StoredWorkspaceMetadata,
    storage::{
        append_workspace_execution_history as append_workspace_execution_history_to_storage,
        clear_workspace_launch_state, is_workspace_missing_error, normalize_workspace_metadata,
        persist_workspace_launch_state, read_app_state, read_workspace_snapshot,
    },
    WorkspaceBootstrapResponse, WorkspaceExecutionHistoryEntry, WorkspaceSnapshot,
    WorkspaceSplitView, WorkspaceTabState,
};
use super::{load_workspace_metadata, persist_workspace_metadata, CommandResponse};
use crate::command::run_blocking_command;

/// Bootstraps the workspace by restoring the last saved workspace if available.
/// Returns the last workspace path and snapshot, or None if no workspace was saved.
#[command]
pub async fn bootstrap_workspace(app: AppHandle) -> CommandResponse<WorkspaceBootstrapResponse> {
    run_blocking_command(move || {
        let app_state = read_app_state(&app)?;
        let Some(last_workspace_path) = app_state.last_workspace_path else {
            return Ok(WorkspaceBootstrapResponse {
                last_workspace_path: None,
                workspace: None,
            });
        };

        match read_workspace_snapshot(Path::new(&last_workspace_path)) {
            Ok(workspace) => Ok(WorkspaceBootstrapResponse {
                last_workspace_path: Some(last_workspace_path),
                workspace: Some(workspace),
            }),
            Err(error) if is_workspace_missing_error(&error) => {
                clear_workspace_launch_state(&app)?;
                Ok(WorkspaceBootstrapResponse {
                    last_workspace_path: None,
                    workspace: None,
                })
            }
            Err(error) => Err(error).context("failed to restore the saved workspace"),
        }
    })
    .await
}

/// Opens a workspace at the specified path, persisting it as the current workspace.
#[command]
pub async fn open_workspace(
    app: AppHandle,
    workspace_path: String,
) -> CommandResponse<WorkspaceSnapshot> {
    let workspace_path = PathBuf::from(workspace_path);

    run_blocking_command(move || {
        let workspace = read_workspace_snapshot(&workspace_path)?;
        persist_workspace_launch_state(&app, &workspace_path)?;
        Ok(workspace)
    })
    .await
}

/// Refreshes the workspace by re-reading the snapshot from disk.
/// Returns None if the workspace directory no longer exists.
#[command]
pub async fn refresh_workspace(
    workspace_path: String,
) -> CommandResponse<Option<WorkspaceSnapshot>> {
    let workspace_path = PathBuf::from(workspace_path);

    run_blocking_command(move || match read_workspace_snapshot(&workspace_path) {
        Ok(workspace) => Ok(Some(workspace)),
        Err(error) if is_workspace_missing_error(&error) => Ok(None),
        Err(error) => Err(error),
    })
    .await
}

/// Persists workspace state including active tab, split view, and all tab states.
#[command]
pub async fn persist_workspace_state(
    app: AppHandle,
    workspace_path: String,
    active_tab_id: Option<String>,
    split_view: Option<WorkspaceSplitView>,
    tabs: Vec<WorkspaceTabState>,
    archived_tabs: Vec<WorkspaceTabState>,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_blocking_command(move || {
        let metadata = load_workspace_metadata(&workspace_path)?;
        let metadata = normalize_workspace_metadata(Some(StoredWorkspaceMetadata {
            version: metadata.version,
            active_tab_id,
            split_view,
            tabs: Some(tabs),
            archived_tabs: Some(archived_tabs),
            execution_history: Some(metadata.execution_history),
        }));
        persist_workspace_metadata(&app, &workspace_path, &metadata)
    })
    .await
}

#[command]
pub async fn append_workspace_execution_history(
    workspace_path: String,
    entry: WorkspaceExecutionHistoryEntry,
) -> CommandResponse<Vec<WorkspaceExecutionHistoryEntry>> {
    let workspace_path = PathBuf::from(workspace_path);

    run_blocking_command(move || {
        append_workspace_execution_history_to_storage(&workspace_path, entry)
    })
    .await
}
