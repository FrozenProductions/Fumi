use std::path::{Path, PathBuf};

use anyhow::{anyhow, Result};
use tauri::{command, AppHandle, State};

use crate::command;
use crate::state::AppRuntimeState;
use crate::workspace::{
    models::StoredWorkspaceMetadata,
    storage::{
        delete_workspace_file_from_disk, ensure_workspace_exists,
        normalize_new_workspace_file_name, normalize_workspace_metadata,
        persist_workspace_launch_state, read_workspace_metadata,
        resolve_workspace_file_delete_path, write_workspace_metadata,
    },
    WorkspaceMetadata, WorkspaceSplitView, WorkspaceTabState,
};

pub(crate) mod archive;
pub(crate) mod files;
pub(crate) mod session;

pub(super) use command::{run_command, CommandResponse};

pub(super) fn load_workspace_metadata(workspace_path: &Path) -> Result<WorkspaceMetadata> {
    ensure_workspace_exists(workspace_path)?;
    read_workspace_metadata(workspace_path)
}

pub(super) fn persist_workspace_metadata(
    app: &AppHandle,
    workspace_path: &Path,
    metadata: &WorkspaceMetadata,
) -> Result<()> {
    write_workspace_metadata(workspace_path, metadata)?;
    persist_workspace_launch_state(app, workspace_path)
}

pub(super) fn find_workspace_tab(
    metadata: &WorkspaceMetadata,
    tab_id: &str,
) -> Result<WorkspaceTabState> {
    metadata
        .tabs
        .iter()
        .find(|item| item.id == tab_id)
        .cloned()
        .ok_or_else(|| anyhow!("Workspace tab not found: {tab_id}"))
}

pub(super) fn require_workspace_tab_file_path(
    workspace_path: &Path,
    file_name: &str,
    missing_message_prefix: &str,
) -> Result<PathBuf> {
    let file_path = workspace_path.join(file_name);

    if !file_path.exists() {
        return Err(anyhow!("{missing_message_prefix}: {file_name}"));
    }

    Ok(file_path)
}

pub(super) fn restore_archived_workspace_tab_state(
    archived_tab: &WorkspaceTabState,
) -> WorkspaceTabState {
    WorkspaceTabState {
        archived_at: None,
        ..archived_tab.clone()
    }
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

fn get_next_split_view_after_delete(
    split_view: Option<WorkspaceSplitView>,
    deleted_tab_id: &str,
) -> Option<WorkspaceSplitView> {
    match split_view {
        Some(split) if split.primary_tab_id == deleted_tab_id => None,
        Some(mut split) if split.secondary_tab_ids.iter().any(|id| id == deleted_tab_id) => {
            split.secondary_tab_ids.retain(|id| id != deleted_tab_id);

            if split.secondary_tab_ids.is_empty() {
                return None;
            }

            if split.secondary_tab_id == deleted_tab_id {
                split.secondary_tab_id = split.secondary_tab_ids.first()?.clone();
            }

            Some(split)
        }
        other => other,
    }
}

pub(super) fn delete_workspace_tab_by_id(
    app: &tauri::AppHandle,
    workspace_path: &Path,
    tab_id: &str,
) -> Result<()> {
    let metadata = load_workspace_metadata(workspace_path)?;
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
        split_view,
        tabs,
        archived_tabs,
    } = StoredWorkspaceMetadata {
        version: metadata.version,
        active_tab_id: metadata.active_tab_id,
        split_view: metadata.split_view,
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
        split_view: get_next_split_view_after_delete(split_view, tab_id),
        tabs: Some(next_tabs),
        archived_tabs: Some(next_archived_tabs),
    }));

    persist_workspace_metadata(app, workspace_path, &normalized_metadata)
}

#[command]
pub fn set_workspace_unsaved_changes(state: State<AppRuntimeState>, has_unsaved_changes: bool) {
    state.set_workspace_unsaved_changes(has_unsaved_changes);
}

#[cfg(test)]
mod tests {
    use super::get_next_split_view_after_delete;
    use crate::workspace::{models::WorkspacePaneId, WorkspaceSplitView};

    fn split_view() -> WorkspaceSplitView {
        WorkspaceSplitView {
            direction: "vertical".to_string(),
            primary_tab_id: "tab-1".to_string(),
            secondary_tab_id: "tab-2".to_string(),
            secondary_tab_ids: vec!["tab-2".to_string(), "tab-3".to_string()],
            split_ratio: 0.5,
            focused_pane: WorkspacePaneId::Secondary,
        }
    }

    #[test]
    fn deleting_active_secondary_tab_promotes_next_secondary_tab() {
        let next_split =
            get_next_split_view_after_delete(Some(split_view()), "tab-2").expect("split remains");

        assert_eq!(next_split.primary_tab_id, "tab-1");
        assert_eq!(next_split.secondary_tab_id, "tab-3");
        assert_eq!(next_split.secondary_tab_ids, vec!["tab-3".to_string()]);
    }

    #[test]
    fn deleting_primary_tab_collapses_split_view() {
        assert!(get_next_split_view_after_delete(Some(split_view()), "tab-1").is_none());
    }
}
