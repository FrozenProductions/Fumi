use std::path::Path;

use anyhow::{anyhow, Result};
use tauri::{command, State};

use crate::state::AppRuntimeState;
use crate::workspace::{
    models::StoredWorkspaceMetadata,
    storage::{
        delete_workspace_file_from_disk, ensure_workspace_exists,
        normalize_new_workspace_file_name, normalize_workspace_metadata,
        persist_workspace_launch_state, read_workspace_metadata,
        resolve_workspace_file_delete_path, write_workspace_metadata,
    },
    WorkspaceTabState,
};

pub(crate) mod archive;
pub(crate) mod files;
pub(crate) mod session;

pub(super) type CommandResponse<T> = std::result::Result<T, String>;

fn format_command_error(error: anyhow::Error) -> String {
    format!("{error:#}")
}

pub(super) fn run_command<T>(operation: impl FnOnce() -> Result<T>) -> CommandResponse<T> {
    operation().map_err(format_command_error)
}

fn get_next_active_tab_id_after_delete(
    next_tabs: &[WorkspaceTabState],
    deleted_open_tab_index: Option<usize>,
    active_tab_id: Option<String>,
) -> Option<String> {
    match deleted_open_tab_index {
        Some(deleted_index) => {
            if let Some(current_active_tab_id) = active_tab_id.as_deref() {
                if next_tabs.iter().any(|tab| tab.id == current_active_tab_id) {
                    return active_tab_id;
                }
            }

            next_tabs
                .get(deleted_index)
                .or_else(|| next_tabs.get(deleted_index.saturating_sub(1)))
                .or_else(|| next_tabs.first())
                .map(|tab| tab.id.clone())
        }
        None => active_tab_id
            .filter(|active_tab_id| next_tabs.iter().any(|tab| tab.id == *active_tab_id)),
    }
}

pub(super) fn delete_workspace_tab_by_id(
    app: &tauri::AppHandle,
    workspace_path: &Path,
    tab_id: &str,
) -> Result<()> {
    ensure_workspace_exists(workspace_path)?;
    let metadata = read_workspace_metadata(workspace_path)?;
    let deleted_tab = metadata
        .tabs
        .iter()
        .chain(metadata.archived_tabs.iter())
        .find(|item| item.id == tab_id)
        .cloned()
        .ok_or_else(|| anyhow!("Workspace tab not found: {tab_id}"))?;
    let deleted_open_tab_index = metadata.tabs.iter().position(|item| item.id == tab_id);
    let normalized_file_name = normalize_new_workspace_file_name(&deleted_tab.file_name);
    let file_path = resolve_workspace_file_delete_path(workspace_path, &deleted_tab.file_name)?;
    delete_workspace_file_from_disk(&file_path)?;

    let StoredWorkspaceMetadata {
        version,
        active_tab_id,
        tabs,
        archived_tabs,
    } = StoredWorkspaceMetadata {
        version: metadata.version,
        active_tab_id: metadata.active_tab_id,
        tabs: Some(metadata.tabs),
        archived_tabs: Some(metadata.archived_tabs),
    };
    let matches_deleted_tab = |item: &WorkspaceTabState| {
        item.id == tab_id
            || (!normalized_file_name.is_empty() && item.file_name == normalized_file_name)
    };
    let next_tabs = tabs
        .unwrap_or_default()
        .into_iter()
        .filter(|item| !matches_deleted_tab(item))
        .collect::<Vec<_>>();
    let next_archived_tabs = archived_tabs
        .unwrap_or_default()
        .into_iter()
        .filter(|item| !matches_deleted_tab(item))
        .collect::<Vec<_>>();
    let normalized_metadata = normalize_workspace_metadata(Some(StoredWorkspaceMetadata {
        version,
        active_tab_id: get_next_active_tab_id_after_delete(
            &next_tabs,
            deleted_open_tab_index,
            active_tab_id,
        ),
        tabs: Some(next_tabs),
        archived_tabs: Some(next_archived_tabs),
    }));

    write_workspace_metadata(workspace_path, &normalized_metadata)?;
    persist_workspace_launch_state(app, workspace_path)
}

#[command]
pub fn set_workspace_unsaved_changes(state: State<AppRuntimeState>, has_unsaved_changes: bool) {
    state.set_workspace_unsaved_changes(has_unsaved_changes);
}
