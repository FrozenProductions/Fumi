use std::{
    fs,
    path::{Path, PathBuf},
};

use anyhow::{anyhow, Context};
use tauri::{command, AppHandle};

use super::super::{
    models::MAX_WORKSPACE_TAB_NAME_LENGTH,
    storage::{
        create_empty_cursor_state, create_workspace_tab_id, ensure_unique_file_name,
        get_next_script_name, get_temporary_rename_file_name, has_conflicting_workspace_file_name,
        is_case_only_workspace_rename, normalize_cursor_state, normalize_new_workspace_file_name,
        write_workspace_file,
    },
    DroppedWorkspaceScriptDraft, WorkspaceCursorState, WorkspaceMetadata, WorkspaceTabSnapshot,
    WorkspaceTabState,
};
use super::{
    delete_workspace_tab_by_id, find_workspace_tab, load_workspace_metadata,
    persist_workspace_metadata, require_workspace_tab_file_path, run_command, CommandResponse,
};

fn is_supported_dropped_workspace_script(file_path: &Path) -> bool {
    matches!(
        file_path.extension().and_then(|value| value.to_str()),
        Some(extension)
            if extension.eq_ignore_ascii_case("lua")
                || extension.eq_ignore_ascii_case("luau")
    )
}

fn build_dropped_workspace_script_draft(
    file_path: &Path,
) -> anyhow::Result<DroppedWorkspaceScriptDraft> {
    if !is_supported_dropped_workspace_script(file_path) {
        return Err(anyhow!("Only .lua and .luau files can be imported."));
    }

    let metadata = fs::metadata(file_path)
        .with_context(|| format!("failed to access dropped file {}", file_path.display()))?;

    if !metadata.is_file() {
        return Err(anyhow!("Dropped path is not a file."));
    }

    let file_name = file_path
        .file_name()
        .and_then(|value| value.to_str())
        .map(str::to_owned)
        .ok_or_else(|| anyhow!("Dropped file name is invalid."))?;
    let file_bytes = fs::read(file_path)
        .with_context(|| format!("failed to read dropped file {}", file_path.display()))?;
    let content = String::from_utf8(file_bytes)
        .map_err(|_| anyhow!("Dropped file must be valid UTF-8 text."))?;

    Ok(DroppedWorkspaceScriptDraft { file_name, content })
}

/// Imports a dropped file as a workspace script draft (.lua or .luau only).
#[command]
pub fn import_workspace_file(file_path: String) -> CommandResponse<DroppedWorkspaceScriptDraft> {
    let file_path = PathBuf::from(file_path);

    run_command(|| build_dropped_workspace_script_draft(&file_path))
}

/// Creates a new workspace file with optional initial content.
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
        let metadata = load_workspace_metadata(&workspace_path)?;
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

        persist_workspace_metadata(
            &app,
            &workspace_path,
            &WorkspaceMetadata {
                version: metadata.version,
                active_tab_id: Some(tab_id.clone()),
                split_view: None,
                tabs: next_tabs,
                archived_tabs: metadata.archived_tabs,
            },
        )?;

        Ok(WorkspaceTabSnapshot {
            id: tab_id,
            file_name: workspace_file_name,
            cursor,
            content: initial_content,
            is_dirty: false,
        })
    })
}

/// Saves workspace tab content and cursor state to disk.
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
        let metadata = load_workspace_metadata(&workspace_path)?;
        let tab = find_workspace_tab(&metadata, &tab_id)?;
        let file_path = require_workspace_tab_file_path(
            &workspace_path,
            &tab.file_name,
            "Workspace tab file not found",
        )?;

        write_workspace_file(&file_path, &content)?;

        let next_metadata = WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: metadata.active_tab_id,
            split_view: metadata.split_view,
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

        persist_workspace_metadata(&app, &workspace_path, &next_metadata)
    })
}

/// Renames a workspace tab file with case-only rename support on macOS.
#[command]
pub fn rename_workspace_file(
    app: AppHandle,
    workspace_path: String,
    tab_id: String,
    file_name: String,
) -> CommandResponse<WorkspaceTabState> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| {
        let metadata = load_workspace_metadata(&workspace_path)?;
        let tab = find_workspace_tab(&metadata, &tab_id)?;

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

        let current_file_path = require_workspace_tab_file_path(
            &workspace_path,
            &tab.file_name,
            "Workspace tab file not found",
        )?;
        let next_file_path = workspace_path.join(&normalized_file_name);
        let is_case_only_rename =
            is_case_only_workspace_rename(&tab.file_name, &normalized_file_name);

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
            split_view: metadata.split_view.clone(),
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

        if let Err(error) = persist_workspace_metadata(&app, &workspace_path, &next_metadata) {
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

/// Deletes a workspace tab and its file from disk.
#[command]
pub fn delete_workspace_file(
    app: AppHandle,
    workspace_path: String,
    tab_id: String,
) -> CommandResponse<()> {
    let workspace_path = PathBuf::from(workspace_path);

    run_command(|| delete_workspace_tab_by_id(&app, &workspace_path, &tab_id))
}

#[cfg(test)]
mod tests {
    use super::build_dropped_workspace_script_draft;
    use std::{
        env, fs,
        path::{Path, PathBuf},
        time::{SystemTime, UNIX_EPOCH},
    };

    struct TestDroppedWorkspaceFile {
        file_name: String,
        path: PathBuf,
    }

    impl TestDroppedWorkspaceFile {
        fn new(file_name: &str, contents: &[u8]) -> Self {
            let unique_suffix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system time should be after unix epoch")
                .as_nanos();
            let path = env::temp_dir().join(format!(
                "fumi-import-workspace-file-{unique_suffix}-{file_name}"
            ));

            fs::write(&path, contents).expect("test dropped workspace file should be created");

            Self {
                file_name: path
                    .file_name()
                    .and_then(|value| value.to_str())
                    .expect("test dropped workspace file should have a file name")
                    .to_string(),
                path,
            }
        }

        fn file_name(&self) -> &str {
            &self.file_name
        }

        fn path(&self) -> &Path {
            &self.path
        }
    }

    impl Drop for TestDroppedWorkspaceFile {
        fn drop(&mut self) {
            let _ = fs::remove_file(&self.path);
        }
    }

    #[test]
    fn builds_import_draft_for_lua_files() {
        let file = TestDroppedWorkspaceFile::new("alpha.lua", b"print('alpha')");
        let draft =
            build_dropped_workspace_script_draft(file.path()).expect("lua file should be imported");

        assert_eq!(draft.file_name, file.file_name());
        assert_eq!(draft.content, "print('alpha')");
    }

    #[test]
    fn builds_import_draft_for_luau_files() {
        let file = TestDroppedWorkspaceFile::new("alpha.luau", b"return true");
        let draft = build_dropped_workspace_script_draft(file.path())
            .expect("luau file should be imported");

        assert_eq!(draft.file_name, file.file_name());
        assert_eq!(draft.content, "return true");
    }

    #[test]
    fn rejects_unsupported_extensions() {
        let file = TestDroppedWorkspaceFile::new("alpha.txt", b"print('alpha')");
        let error = build_dropped_workspace_script_draft(file.path())
            .expect_err("unsupported files should be rejected");

        assert_eq!(
            error.to_string(),
            "Only .lua and .luau files can be imported."
        );
    }

    #[test]
    fn rejects_missing_files() {
        let missing_path = env::temp_dir().join("fumi-import-workspace-file-missing.lua");
        let error = build_dropped_workspace_script_draft(&missing_path)
            .expect_err("missing files should be rejected");

        assert!(
            error.to_string().contains("failed to access dropped file"),
            "unexpected error: {error}"
        );
    }

    #[test]
    fn rejects_non_utf8_content() {
        let file = TestDroppedWorkspaceFile::new("alpha.lua", &[0xFF, 0xFE, 0xFD]);
        let error = build_dropped_workspace_script_draft(file.path())
            .expect_err("non-utf8 files should be rejected");

        assert_eq!(error.to_string(), "Dropped file must be valid UTF-8 text.");
    }
}
