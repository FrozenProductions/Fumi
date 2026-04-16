use std::{collections::HashSet, fs};

use anyhow::{anyhow, Context, Result};
use tauri::command;

use crate::{
    command::{run_command, CommandResponse},
    executor::ExecutorKind,
};

use super::{
    storage::{
        create_script, create_script_id, find_script, get_temporary_rename_file_name,
        has_conflicting_script_file_name, is_case_only_rename, normalize_cursor_state,
        normalize_script_file_name, read_automatic_execution_metadata,
        read_automatic_execution_snapshot, resolve_automatic_execution_path,
        write_automatic_execution_metadata,
    },
    AutomaticExecutionMetadata, AutomaticExecutionScriptSnapshot,
    AutomaticExecutionScriptState, AutomaticExecutionSnapshot,
};

fn load_metadata(
    executor_kind: ExecutorKind,
) -> Result<(ExecutorKind, std::path::PathBuf, AutomaticExecutionMetadata)> {
    let automatic_execution_path = resolve_automatic_execution_path(executor_kind)?;
    let metadata = read_automatic_execution_metadata(&automatic_execution_path)?;
    Ok((executor_kind, automatic_execution_path, metadata))
}

#[command]
pub fn bootstrap_automatic_execution(
    executor_kind: ExecutorKind,
) -> CommandResponse<AutomaticExecutionSnapshot> {
    run_command(|| read_automatic_execution_snapshot(executor_kind))
}

#[command]
pub fn refresh_automatic_execution(
    executor_kind: ExecutorKind,
) -> CommandResponse<AutomaticExecutionSnapshot> {
    run_command(|| read_automatic_execution_snapshot(executor_kind))
}

#[command]
pub fn create_automatic_execution_script(
    executor_kind: ExecutorKind,
    file_name: Option<String>,
    initial_content: Option<String>,
) -> CommandResponse<AutomaticExecutionScriptSnapshot> {
    let initial_content = initial_content.unwrap_or_default();

    run_command(|| {
        let (_, automatic_execution_path, metadata) = load_metadata(executor_kind)?;
        let created_script = create_script(
            &automatic_execution_path,
            &metadata,
            file_name.as_deref(),
            &initial_content,
        )?;
        let mut next_scripts = metadata.scripts.clone();
        next_scripts.push(AutomaticExecutionScriptState {
            id: created_script.id.clone(),
            file_name: created_script.file_name.clone(),
            cursor: created_script.cursor.clone(),
        });
        write_automatic_execution_metadata(
            &automatic_execution_path,
            &AutomaticExecutionMetadata {
                version: metadata.version,
                active_script_id: Some(created_script.id.clone()),
                scripts: next_scripts,
            },
        )?;

        Ok(created_script)
    })
}

#[command]
pub fn save_automatic_execution_script(
    executor_kind: ExecutorKind,
    script_id: String,
    content: String,
    cursor: super::AutomaticExecutionCursorState,
) -> CommandResponse<()> {
    run_command(|| {
        let (_, automatic_execution_path, metadata) = load_metadata(executor_kind)?;
        let script = find_script(&metadata, &script_id)?;
        let file_path = automatic_execution_path.join(&script.file_name);

        fs::write(&file_path, content)
            .with_context(|| format!("failed to write {}", file_path.display()))?;

        write_automatic_execution_metadata(
            &automatic_execution_path,
            &AutomaticExecutionMetadata {
                version: metadata.version,
                active_script_id: metadata.active_script_id,
                scripts: metadata
                    .scripts
                    .into_iter()
                    .map(|item| {
                        if item.id == script_id {
                            AutomaticExecutionScriptState {
                                id: item.id,
                                file_name: item.file_name,
                                cursor: normalize_cursor_state(&cursor),
                            }
                        } else {
                            item
                        }
                    })
                    .collect(),
            },
        )
    })
}

#[command]
pub fn rename_automatic_execution_script(
    executor_kind: ExecutorKind,
    script_id: String,
    file_name: String,
) -> CommandResponse<AutomaticExecutionScriptState> {
    run_command(|| {
        let (_, automatic_execution_path, metadata) = load_metadata(executor_kind)?;
        let script = find_script(&metadata, &script_id)?;
        let normalized_file_name = normalize_script_file_name(&file_name);

        if normalized_file_name.is_empty() {
            return Err(anyhow!(
                "File name is invalid or exceeds {} characters.",
                super::models::MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH
            ));
        }

        if normalized_file_name == script.file_name {
            return Ok(script);
        }

        if has_conflicting_script_file_name(&metadata, &script_id, &normalized_file_name) {
            return Err(anyhow!(
                "A file named {normalized_file_name} already exists."
            ));
        }

        let current_file_path = automatic_execution_path.join(&script.file_name);
        if !current_file_path.exists() {
            return Err(anyhow!(
                "Automatic execution script file not found: {}",
                script.file_name
            ));
        }

        let next_file_path = automatic_execution_path.join(&normalized_file_name);
        let is_case_only_rename =
            is_case_only_rename(&script.file_name, &normalized_file_name);

        if next_file_path.exists() && !is_case_only_rename {
            return Err(anyhow!(
                "A file named {normalized_file_name} already exists."
            ));
        }

        let next_script = AutomaticExecutionScriptState {
            id: script.id.clone(),
            file_name: normalized_file_name.clone(),
            cursor: script.cursor.clone(),
        };
        let next_metadata = AutomaticExecutionMetadata {
            version: metadata.version,
            active_script_id: metadata.active_script_id.clone(),
            scripts: metadata
                .scripts
                .iter()
                .map(|item| {
                    if item.id == script_id {
                        next_script.clone()
                    } else {
                        item.clone()
                    }
                })
                .collect(),
        };

        if is_case_only_rename && cfg!(target_os = "macos") {
            let temporary_file_name = get_temporary_rename_file_name(
                &automatic_execution_path,
                &metadata,
                &script_id,
                &normalized_file_name,
            );
            let temporary_file_path = automatic_execution_path.join(&temporary_file_name);

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

        if let Err(error) =
            write_automatic_execution_metadata(&automatic_execution_path, &next_metadata)
        {
            if let Err(rollback_error) = fs::rename(&next_file_path, &current_file_path) {
                eprintln!(
                    "Failed to roll back automatic execution file rename after metadata update failure: {rollback_error}"
                );
                return Err(anyhow!(
                    "Renamed {} to {}, but failed to update automatic execution metadata.",
                    script.file_name,
                    normalized_file_name
                ));
            }

            return Err(error);
        }

        Ok(next_script)
    })
}

#[command]
pub fn delete_automatic_execution_script(
    executor_kind: ExecutorKind,
    script_id: String,
) -> CommandResponse<()> {
    run_command(|| {
        let (_, automatic_execution_path, metadata) = load_metadata(executor_kind)?;
        let script = find_script(&metadata, &script_id)?;
        let file_path = automatic_execution_path.join(&script.file_name);

        match fs::remove_file(&file_path) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => {
                return Err(error)
                    .with_context(|| format!("failed to delete {}", file_path.display()));
            }
        }

        let next_scripts = metadata
            .scripts
            .into_iter()
            .filter(|item| item.id != script_id)
            .collect::<Vec<_>>();
        let next_metadata = AutomaticExecutionMetadata {
            version: 1,
            active_script_id: metadata
                .active_script_id
                .filter(|active_script_id| active_script_id != &script_id),
            scripts: next_scripts,
        };

        write_automatic_execution_metadata(&automatic_execution_path, &next_metadata)
    })
}

#[command]
pub fn persist_automatic_execution_state(
    executor_kind: ExecutorKind,
    active_script_id: Option<String>,
    scripts: Vec<AutomaticExecutionScriptState>,
) -> CommandResponse<()> {
    run_command(|| {
        let (_, automatic_execution_path, existing_metadata) = load_metadata(executor_kind)?;
        let on_disk_file_names = existing_metadata
            .scripts
            .iter()
            .map(|script| script.file_name.clone())
            .collect::<HashSet<_>>();
        let normalized_scripts = scripts
            .into_iter()
            .filter(|script| on_disk_file_names.contains(&script.file_name))
            .map(|script| AutomaticExecutionScriptState {
                id: if script.id.trim().is_empty() {
                    let existing_ids = existing_metadata
                        .scripts
                        .iter()
                        .map(|item| item.id.clone())
                        .collect::<HashSet<_>>();
                    create_script_id(&existing_ids)
                } else {
                    script.id.trim().to_string()
                },
                file_name: script.file_name,
                cursor: normalize_cursor_state(&script.cursor),
            })
            .collect::<Vec<_>>();

        write_automatic_execution_metadata(
            &automatic_execution_path,
            &AutomaticExecutionMetadata {
                version: 1,
                active_script_id,
                scripts: normalized_scripts,
            },
        )
    })
}
