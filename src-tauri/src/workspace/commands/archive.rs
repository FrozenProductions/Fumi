//! Workspace archive commands: restore and delete archived tabs.

use std::{fs, path::PathBuf};

use anyhow::{anyhow, Context};
use tauri::{command, AppHandle};

use super::super::{
    models::StoredWorkspaceMetadata,
    storage::{
        delete_workspace_file_from_disk, normalize_workspace_metadata,
        resolve_workspace_file_delete_path,
    },
    WorkspaceMetadata, WorkspaceTabSnapshot,
};
use super::{
    delete_workspace_tab_by_id, load_workspace_metadata, persist_workspace_metadata,
    require_workspace_tab_file_path, restore_archived_workspace_tab_state, run_command,
    CommandResponse,
};

/// Restores an archived workspace tab back to active tabs.
#[command]
pub fn restore_archived_workspace_tab(
    app: AppHandle,
    workspace_path: String,
    tab_id: String,
) -> CommandResponse<WorkspaceTabSnapshot> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        let metadata = load_workspace_metadata(&workspace_path)?;
        let archived_tab = metadata
            .archived_tabs
            .iter()
            .find(|item| item.id == tab_id)
            .cloned()
            .ok_or_else(|| anyhow!("Archived workspace tab not found: {tab_id}"))?;
        let file_path = require_workspace_tab_file_path(
            &workspace_path,
            &archived_tab.file_name,
            "Archived workspace tab file not found",
        )?;

        let content = fs::read_to_string(&file_path)
            .with_context(|| format!("failed to read {}", file_path.display()))?;
        let restored_tab = restore_archived_workspace_tab_state(&archived_tab);
        let next_metadata = WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: Some(restored_tab.id.clone()),
            split_view: metadata.split_view,
            tabs: metadata
                .tabs
                .iter()
                .cloned()
                .chain(std::iter::once(restored_tab))
                .collect(),
            archived_tabs: metadata
                .archived_tabs
                .into_iter()
                .filter(|item| item.id != tab_id)
                .collect(),
            execution_history: metadata.execution_history,
        };

        persist_workspace_metadata(&app, &workspace_path, &next_metadata)?;

        Ok(WorkspaceTabSnapshot {
            id: archived_tab.id,
            file_name: archived_tab.file_name,
            cursor: archived_tab.cursor,
            content,
            is_dirty: false,
        })
    })
}

/// Deletes an archived workspace tab without restoring it.
#[command]
pub fn delete_archived_workspace_tab(
    app: AppHandle,
    workspace_path: String,
    tab_id: String,
    _file_name: String,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| delete_workspace_tab_by_id(&app, &workspace_path, &tab_id))
}

/// Restores all archived workspace tabs back to active tabs.
#[command]
pub fn restore_all_archived_workspace_tabs(
    app: AppHandle,
    workspace_path: String,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        let metadata = load_workspace_metadata(&workspace_path)?;

        let mut next_tabs = metadata.tabs.clone();
        for archived_tab in &metadata.archived_tabs {
            if workspace_path.join(&archived_tab.file_name).exists() {
                next_tabs.push(restore_archived_workspace_tab_state(archived_tab));
            }
        }

        let next_metadata = WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: metadata.active_tab_id,
            split_view: metadata.split_view,
            tabs: next_tabs,
            archived_tabs: Vec::new(),
            execution_history: metadata.execution_history,
        };

        persist_workspace_metadata(&app, &workspace_path, &next_metadata)
    })
}

/// Deletes all archived workspace tabs from disk and metadata.
#[command]
pub fn delete_all_archived_workspace_tabs(
    app: AppHandle,
    workspace_path: String,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        let metadata = load_workspace_metadata(&workspace_path)?;

        for archived_tab in &metadata.archived_tabs {
            if let Ok(file_path) =
                resolve_workspace_file_delete_path(&workspace_path, &archived_tab.file_name)
            {
                let _ = delete_workspace_file_from_disk(&file_path);
            }
        }

        let next_metadata = WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: metadata.active_tab_id,
            split_view: metadata.split_view,
            tabs: metadata.tabs,
            archived_tabs: Vec::new(),
            execution_history: metadata.execution_history,
        };

        let normalized_metadata = normalize_workspace_metadata(Some(StoredWorkspaceMetadata {
            version: next_metadata.version,
            active_tab_id: next_metadata.active_tab_id,
            split_view: next_metadata.split_view,
            tabs: Some(next_metadata.tabs),
            archived_tabs: Some(next_metadata.archived_tabs),
            execution_history: Some(next_metadata.execution_history),
        }));
        persist_workspace_metadata(&app, &workspace_path, &normalized_metadata)
    })
}
