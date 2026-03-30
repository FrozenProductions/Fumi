use std::path::{Path, PathBuf};

use anyhow::Context;
use tauri::{command, AppHandle};

use super::super::{
    models::StoredWorkspaceMetadata,
    storage::{
        clear_workspace_launch_state, ensure_workspace_exists, is_workspace_missing_error,
        normalize_workspace_metadata, persist_workspace_launch_state, read_app_state,
        read_workspace_snapshot, write_workspace_metadata,
    },
    WorkspaceBootstrapResponse, WorkspaceSnapshot, WorkspaceTabState,
};
use super::{run_command, CommandResponse};

#[command]
pub fn bootstrap_workspace(app: AppHandle) -> CommandResponse<WorkspaceBootstrapResponse> {
    run_command(|| {
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
}

#[command]
pub fn open_workspace(
    app: AppHandle,
    workspace_path: String,
) -> CommandResponse<WorkspaceSnapshot> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        let workspace = read_workspace_snapshot(&workspace_path)?;
        persist_workspace_launch_state(&app, &workspace_path)?;
        Ok(workspace)
    })
}

#[command]
pub fn refresh_workspace(workspace_path: String) -> CommandResponse<Option<WorkspaceSnapshot>> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| match read_workspace_snapshot(&workspace_path) {
        Ok(workspace) => Ok(Some(workspace)),
        Err(error) if is_workspace_missing_error(&error) => Ok(None),
        Err(error) => Err(error),
    })
}

#[command]
pub fn persist_workspace_state(
    app: AppHandle,
    workspace_path: String,
    active_tab_id: Option<String>,
    tabs: Vec<WorkspaceTabState>,
    archived_tabs: Vec<WorkspaceTabState>,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        ensure_workspace_exists(&workspace_path)?;
        let metadata = normalize_workspace_metadata(Some(StoredWorkspaceMetadata {
            version: 2,
            active_tab_id,
            tabs: Some(tabs),
            archived_tabs: Some(archived_tabs),
        }));
        write_workspace_metadata(&workspace_path, &metadata)?;
        persist_workspace_launch_state(&app, &workspace_path)
    })
}
