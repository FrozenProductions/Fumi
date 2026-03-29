use std::{
    fs,
    path::{Path, PathBuf},
};

use anyhow::{anyhow, Context, Result};
use tauri::{command, AppHandle, State};

use crate::state::AppRuntimeState;

use super::{
    models::{StoredWorkspaceMetadata, MAX_WORKSPACE_TAB_NAME_LENGTH},
    storage::{
        clear_workspace_launch_state, create_empty_cursor_state, create_workspace_tab_id,
        delete_workspace_file_from_disk, ensure_unique_file_name, ensure_workspace_exists,
        get_next_script_name, get_temporary_rename_file_name, has_conflicting_workspace_file_name,
        is_case_only_workspace_rename, is_workspace_missing_error, normalize_cursor_state,
        normalize_new_workspace_file_name, normalize_workspace_metadata,
        persist_workspace_launch_state, read_app_state, read_workspace_metadata,
        read_workspace_snapshot, resolve_workspace_file_delete_path, write_workspace_file,
        write_workspace_metadata,
    },
    WorkspaceBootstrapResponse, WorkspaceCursorState, WorkspaceMetadata, WorkspaceSnapshot,
    WorkspaceTabSnapshot, WorkspaceTabState,
};

type CommandResponse<T> = std::result::Result<T, String>;

fn format_command_error(error: anyhow::Error) -> String {
    format!("{error:#}")
}

fn run_command<T>(operation: impl FnOnce() -> Result<T>) -> CommandResponse<T> {
    operation().map_err(format_command_error)
}

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
        let next_metadata = WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: Some(archived_tab.id.clone()),
            tabs: metadata
                .tabs
                .iter()
                .cloned()
                .chain(std::iter::once(archived_tab.clone()))
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

    run_command(|| {
        ensure_workspace_exists(&workspace_path)?;
        let metadata = read_workspace_metadata(&workspace_path)?;
        let archived_tab = metadata
            .archived_tabs
            .iter()
            .find(|item| item.id == tab_id)
            .cloned()
            .ok_or_else(|| anyhow!("Archived workspace tab not found: {tab_id}"))?;
        let normalized_file_name = normalize_new_workspace_file_name(&archived_tab.file_name);
        let file_path =
            resolve_workspace_file_delete_path(&workspace_path, &archived_tab.file_name)?;
        delete_workspace_file_from_disk(&file_path)?;

        let next_metadata = WorkspaceMetadata {
            version: 2,
            active_tab_id: if metadata.active_tab_id.as_deref() == Some(tab_id.as_str())
                || metadata
                    .tabs
                    .iter()
                    .any(|item| item.id == tab_id || item.file_name == normalized_file_name)
            {
                None
            } else {
                metadata.active_tab_id
            },
            tabs: metadata
                .tabs
                .into_iter()
                .filter(|item| item.id != tab_id && item.file_name != normalized_file_name)
                .collect(),
            archived_tabs: metadata
                .archived_tabs
                .into_iter()
                .filter(|item| item.id != tab_id && item.file_name != normalized_file_name)
                .collect(),
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

#[command]
pub fn set_workspace_unsaved_changes(state: State<AppRuntimeState>, has_unsaved_changes: bool) {
    state.set_workspace_unsaved_changes(has_unsaved_changes);
}
