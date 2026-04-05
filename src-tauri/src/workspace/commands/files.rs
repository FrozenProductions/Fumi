use std::{fs, path::PathBuf};

use anyhow::{anyhow, Context};
use tauri::{command, AppHandle};

use super::super::{
    models::MAX_WORKSPACE_TAB_NAME_LENGTH,
    storage::{
        create_empty_cursor_state, create_workspace_tab_id, ensure_unique_file_name,
        ensure_workspace_exists, get_next_script_name, get_temporary_rename_file_name,
        has_conflicting_workspace_file_name, is_case_only_workspace_rename, normalize_cursor_state,
        normalize_new_workspace_file_name, persist_workspace_launch_state, read_workspace_metadata,
        write_workspace_file, write_workspace_metadata,
    },
    WorkspaceCursorState, WorkspaceMetadata, WorkspaceTabSnapshot, WorkspaceTabState,
};
use super::{delete_workspace_tab_by_id, run_command, CommandResponse};

#[command]
pub fn create_workspace_file(
    app: AppHandle,
    workspace_path: String,
    file_name: Option<String>,
    initial_content: Option<String>,
) -> CommandResponse<WorkspaceTabSnapshot> {
    let workspace_path = PathBuf::from(workspace_path);
    let initial_content = initial_content.unwrap_or_default();

    run_command(|| {
        ensure_workspace_exists(&workspace_path)?;
        let metadata = read_workspace_metadata(&workspace_path)?;
        let trimmed_file_name = file_name.as_deref().map(str::trim).unwrap_or_default();
        let preferred_workspace_file_name = if trimmed_file_name.is_empty() {
            get_next_script_name(&workspace_path, &metadata)
        } else {
            normalize_new_workspace_file_name(trimmed_file_name)
        };

        if !trimmed_file_name.is_empty() && preferred_workspace_file_name.is_empty() {
            return Err(anyhow!(
                "File name is invalid or exceeds {MAX_WORKSPACE_TAB_NAME_LENGTH} characters."
            ));
        }

        let workspace_file_name =
            ensure_unique_file_name(&workspace_path, &metadata, &preferred_workspace_file_name);
        let tab_id = create_workspace_tab_id(
            &metadata
                .tabs
                .iter()
                .chain(metadata.archived_tabs.iter())
                .map(|tab| tab.id.clone())
                .collect(),
        );
        let cursor = create_empty_cursor_state();
        let workspace_file_path = workspace_path.join(&workspace_file_name);

        write_workspace_file(&workspace_file_path, &initial_content)?;

        let mut next_tabs = metadata.tabs.clone();
        next_tabs.push(WorkspaceTabState {
            id: tab_id.clone(),
            file_name: workspace_file_name.clone(),
            cursor: cursor.clone(),
            archived_at: None,
        });

        write_workspace_metadata(
            &workspace_path,
            &WorkspaceMetadata {
                version: metadata.version,
                active_tab_id: Some(tab_id.clone()),
                tabs: next_tabs,
                archived_tabs: metadata.archived_tabs,
            },
        )?;
        persist_workspace_launch_state(&app, &workspace_path)?;

        Ok(WorkspaceTabSnapshot {
            id: tab_id,
            file_name: workspace_file_name,
            cursor,
            content: initial_content,
            is_dirty: false,
        })
    })
}

#[command]
pub fn save_workspace_file(
    app: AppHandle,
    workspace_path: String,
    tab_id: String,
    content: String,
    cursor: WorkspaceCursorState,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        ensure_workspace_exists(&workspace_path)?;
        let metadata = read_workspace_metadata(&workspace_path)?;
        let tab = metadata
            .tabs
            .iter()
            .find(|item| item.id == tab_id)
            .cloned()
            .ok_or_else(|| anyhow!("Workspace tab not found: {tab_id}"))?;

        let file_path = workspace_path.join(&tab.file_name);
        if !file_path.exists() {
            return Err(anyhow!("Workspace tab file not found: {}", tab.file_name));
        }

        write_workspace_file(&file_path, &content)?;

        let next_metadata = WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: metadata.active_tab_id,
            tabs: metadata
                .tabs
                .into_iter()
                .map(|item| {
                    if item.id == tab_id {
                        WorkspaceTabState {
                            id: item.id,
                            file_name: item.file_name,
                            cursor: normalize_cursor_state(&cursor),
                            archived_at: item.archived_at,
                        }
                    } else {
                        item
                    }
                })
                .collect(),
            archived_tabs: metadata.archived_tabs,
        };

        write_workspace_metadata(&workspace_path, &next_metadata)?;
        persist_workspace_launch_state(&app, &workspace_path)
    })
}

#[command]
pub fn rename_workspace_file(
    app: AppHandle,
    workspace_path: String,
    tab_id: String,
    file_name: String,
) -> CommandResponse<WorkspaceTabState> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        ensure_workspace_exists(&workspace_path)?;
        let metadata = read_workspace_metadata(&workspace_path)?;
        let tab = metadata
            .tabs
            .iter()
            .find(|item| item.id == tab_id)
            .cloned()
            .ok_or_else(|| anyhow!("Workspace tab not found: {tab_id}"))?;

        let normalized_file_name = normalize_new_workspace_file_name(&file_name);
        if normalized_file_name.is_empty() {
            return Err(anyhow!(
                "File name is invalid or exceeds {MAX_WORKSPACE_TAB_NAME_LENGTH} characters."
            ));
        }

        if normalized_file_name == tab.file_name {
            return Ok(tab);
        }

        if has_conflicting_workspace_file_name(&metadata, &tab_id, &normalized_file_name) {
            return Err(anyhow!(
                "A file named {normalized_file_name} already exists."
            ));
        }

        let current_file_path = workspace_path.join(&tab.file_name);
        let next_file_path = workspace_path.join(&normalized_file_name);
        let is_case_only_rename =
            is_case_only_workspace_rename(&tab.file_name, &normalized_file_name);

        if !current_file_path.exists() {
            return Err(anyhow!("Workspace tab file not found: {}", tab.file_name));
        }

        if next_file_path.exists() && !is_case_only_rename {
            return Err(anyhow!(
                "A file named {normalized_file_name} already exists."
            ));
        }

        let next_tab = WorkspaceTabState {
            id: tab.id.clone(),
            file_name: normalized_file_name.clone(),
            cursor: tab.cursor.clone(),
            archived_at: tab.archived_at,
        };
        let next_metadata = WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: metadata.active_tab_id.clone(),
            tabs: metadata
                .tabs
                .iter()
                .map(|item| {
                    if item.id == tab_id {
                        next_tab.clone()
                    } else {
                        item.clone()
                    }
                })
                .collect(),
            archived_tabs: metadata.archived_tabs.clone(),
        };

        if is_case_only_rename && cfg!(target_os = "macos") {
            let temporary_file_name = get_temporary_rename_file_name(
                &workspace_path,
                &metadata,
                &tab_id,
                &normalized_file_name,
            );
            let temporary_file_path = workspace_path.join(&temporary_file_name);

            fs::rename(&current_file_path, &temporary_file_path).with_context(|| {
                format!(
                    "failed to rename {} to {}",
                    current_file_path.display(),
                    temporary_file_path.display()
                )
            })?;

            if let Err(error) = fs::rename(&temporary_file_path, &next_file_path) {
                let _ = fs::rename(&temporary_file_path, &current_file_path);
                return Err(error).with_context(|| {
                    format!(
                        "failed to rename {} to {}",
                        temporary_file_path.display(),
                        next_file_path.display()
                    )
                });
            }
        } else {
            fs::rename(&current_file_path, &next_file_path).with_context(|| {
                format!(
                    "failed to rename {} to {}",
                    current_file_path.display(),
                    next_file_path.display()
                )
            })?;
        }

        if let Err(error) = write_workspace_metadata(&workspace_path, &next_metadata)
            .and_then(|_| persist_workspace_launch_state(&app, &workspace_path))
        {
            if let Err(rollback_error) = fs::rename(&next_file_path, &current_file_path) {
                eprintln!(
                    "Failed to roll back workspace file rename after metadata update failure: {rollback_error}"
                );
                return Err(anyhow!(
                    "Renamed {} to {}, but failed to update workspace metadata.",
                    tab.file_name,
                    normalized_file_name
                ));
            }

            return Err(error);
        }

        Ok(next_tab)
    })
}

#[command]
pub fn delete_workspace_file(
    app: AppHandle,
    workspace_path: String,
    tab_id: String,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| delete_workspace_tab_by_id(&app, &workspace_path, &tab_id))
}
