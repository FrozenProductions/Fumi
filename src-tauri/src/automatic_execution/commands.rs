use std::{collections::HashSet, fs};

use anyhow::{anyhow, Context, Result};
use tauri::command;

use crate::{
    command::{run_blocking_command, CommandResponse},
    executor::ExecutorKind,
    metadata::AUTOMATIC_EXECUTION_METADATA_VERSION,
};

use super::{
    storage::{
        create_script, create_script_id, find_script, get_temporary_rename_file_name,
        has_conflicting_script_file_name, is_case_only_rename, normalize_cursor_state,
        normalize_script_file_name, read_automatic_execution_metadata,
        read_automatic_execution_snapshot, resolve_automatic_execution_path,
        write_automatic_execution_metadata,
    },
    AutomaticExecutionMetadata, AutomaticExecutionScriptSnapshot, AutomaticExecutionScriptState,
    AutomaticExecutionSnapshot,
};

fn load_metadata(
    executor_kind: ExecutorKind,
) -> Result<(ExecutorKind, std::path::PathBuf, AutomaticExecutionMetadata)> {
    let automatic_execution_path = resolve_automatic_execution_path(executor_kind)?;
    let metadata = read_automatic_execution_metadata(&automatic_execution_path)?;
    Ok((executor_kind, automatic_execution_path, metadata))
}

/// Bootstraps the automatic execution system by reading all scripts and metadata.
#[command]
pub async fn bootstrap_automatic_execution(
    executor_kind: ExecutorKind,
) -> CommandResponse<AutomaticExecutionSnapshot> {
    run_blocking_command(move || read_automatic_execution_snapshot(executor_kind)).await
}

/// Refreshes automatic execution by re-reading scripts and metadata from disk.
#[command]
pub async fn refresh_automatic_execution(
    executor_kind: ExecutorKind,
) -> CommandResponse<AutomaticExecutionSnapshot> {
    run_blocking_command(move || read_automatic_execution_snapshot(executor_kind)).await
}

/// Creates a new automatic execution script with optional initial content.
#[command]
pub async fn create_automatic_execution_script(
    executor_kind: ExecutorKind,
    file_name: Option<String>,
    initial_content: Option<String>,
) -> CommandResponse<AutomaticExecutionScriptSnapshot> {
    let initial_content = initial_content.unwrap_or_default();

    run_blocking_command(move || {
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
    .await
}

/// Saves script content and cursor state to disk.
#[command]
pub async fn save_automatic_execution_script(
    executor_kind: ExecutorKind,
    script_id: String,
    content: String,
    cursor: super::AutomaticExecutionCursorState,
) -> CommandResponse<()> {
    run_blocking_command(move || {
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
    .await
}

/// Renames a script file with case-only rename support on macOS.
#[command]
pub async fn rename_automatic_execution_script(
    executor_kind: ExecutorKind,
    script_id: String,
    file_name: String,
) -> CommandResponse<AutomaticExecutionScriptState> {
    run_blocking_command(move || {
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
        let is_case_only_rename = is_case_only_rename(&script.file_name, &normalized_file_name);

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
    .await
}

/// Deletes a script file and removes it from metadata.
#[command]
pub async fn delete_automatic_execution_script(
    executor_kind: ExecutorKind,
    script_id: String,
) -> CommandResponse<()> {
    run_blocking_command(move || {
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
            version: AUTOMATIC_EXECUTION_METADATA_VERSION,
            active_script_id: metadata
                .active_script_id
                .filter(|active_script_id| active_script_id != &script_id),
            scripts: next_scripts,
        };

        write_automatic_execution_metadata(&automatic_execution_path, &next_metadata)
    })
    .await
}

/// Persists the automatic execution state including active script and all script IDs.
#[command]
pub async fn persist_automatic_execution_state(
    executor_kind: ExecutorKind,
    active_script_id: Option<String>,
    scripts: Vec<AutomaticExecutionScriptState>,
) -> CommandResponse<()> {
    run_blocking_command(move || {
        let (_, automatic_execution_path, existing_metadata) = load_metadata(executor_kind)?;
        let on_disk_file_names = existing_metadata
            .scripts
            .iter()
            .map(|script| script.file_name.clone())
            .collect::<HashSet<_>>();
        let mut existing_ids = existing_metadata
            .scripts
            .iter()
            .map(|item| item.id.clone())
            .collect::<HashSet<_>>();
        let (persisted_scripts, dropped_scripts): (Vec<_>, Vec<_>) = scripts
            .into_iter()
            .partition(|script| on_disk_file_names.contains(&script.file_name));

        for dropped_script in &dropped_scripts {
            eprintln!(
                "Skipping automatic execution metadata for missing script file: {}",
                dropped_script.file_name
            );
        }

        let normalized_scripts = persisted_scripts
            .into_iter()
            .map(|script| AutomaticExecutionScriptState {
                id: if script.id.trim().is_empty() {
                    let next_id = create_script_id(&existing_ids);
                    existing_ids.insert(next_id.clone());
                    next_id
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
                version: AUTOMATIC_EXECUTION_METADATA_VERSION,
                active_script_id,
                scripts: normalized_scripts,
            },
        )
    })
    .await
}
