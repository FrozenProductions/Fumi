use std::{fs, path::PathBuf};

use anyhow::{anyhow, Context};
use tauri::{command, AppHandle};

use super::super::{
    models::StoredWorkspaceMetadata,
    storage::{
        delete_workspace_file_from_disk, ensure_workspace_exists,
        normalize_workspace_metadata, persist_workspace_launch_state,
        read_workspace_metadata, resolve_workspace_file_delete_path,
        write_workspace_metadata,
    },
    WorkspaceMetadata, WorkspaceTabSnapshot, WorkspaceTabState,
};
use super::{delete_workspace_tab_by_id, run_command, CommandResponse};

#[command]
pub fn restore_archived_workspace_tab(
    app: AppHandle,
    workspace_path: String,
    tab_id: String,
) -> CommandResponse<WorkspaceTabSnapshot> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        ensure_workspace_exists(&workspace_path)?;
        let metadata = read_workspace_metadata(&workspace_path)?;
        let archived_tab = metadata
            .archived_tabs
            .iter()
            .find(|item| item.id == tab_id)
            .cloned()
            .ok_or_else(|| anyhow!("Archived workspace tab not found: {tab_id}"))?;

        let file_path = workspace_path.join(&archived_tab.file_name);
        if !file_path.exists() {
            return Err(anyhow!(
                "Archived workspace tab file not found: {}",
                archived_tab.file_name
            ));
        }

        let content = fs::read_to_string(&file_path)
            .with_context(|| format!("failed to read {}", file_path.display()))?;
        let restored_tab = WorkspaceTabState {
            archived_at: None,
            ..archived_tab.clone()
        };
        let next_metadata = WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: Some(restored_tab.id.clone()),
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
        };

        write_workspace_metadata(&workspace_path, &next_metadata)?;
        persist_workspace_launch_state(&app, &workspace_path)?;

        Ok(WorkspaceTabSnapshot {
            id: archived_tab.id,
            file_name: archived_tab.file_name,
            cursor: archived_tab.cursor,
            content,
            is_dirty: false,
        })
    })
}

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

#[command]
pub fn restore_all_archived_workspace_tabs(
    app: AppHandle,
    workspace_path: String,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        ensure_workspace_exists(&workspace_path)?;
        let metadata = read_workspace_metadata(&workspace_path)?;

        let mut next_tabs = metadata.tabs.clone();
        for archived_tab in &metadata.archived_tabs {
            let file_path = workspace_path.join(&archived_tab.file_name);
            if file_path.exists() {
                next_tabs.push(WorkspaceTabState {
                    archived_at: None,
                    ..archived_tab.clone()
                });
            }
        }

        let next_metadata = WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: metadata.active_tab_id,
            tabs: next_tabs,
            archived_tabs: Vec::new(),
        };

        write_workspace_metadata(&workspace_path, &next_metadata)?;
        persist_workspace_launch_state(&app, &workspace_path)
    })
}

#[command]
pub fn delete_all_archived_workspace_tabs(
    app: AppHandle,
    workspace_path: String,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        ensure_workspace_exists(&workspace_path)?;
        let metadata = read_workspace_metadata(&workspace_path)?;

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
            tabs: metadata.tabs,
            archived_tabs: Vec::new(),
        };

        let normalized_metadata = normalize_workspace_metadata(Some(StoredWorkspaceMetadata {
            version: next_metadata.version,
            active_tab_id: next_metadata.active_tab_id,
            tabs: Some(next_metadata.tabs),
            archived_tabs: Some(next_metadata.archived_tabs),
        }));
        write_workspace_metadata(&workspace_path, &normalized_metadata)?;
        persist_workspace_launch_state(&app, &workspace_path)
    })
}
