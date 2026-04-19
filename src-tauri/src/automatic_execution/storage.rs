use std::{
    collections::{HashMap, HashSet},
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
};

use anyhow::{anyhow, Context, Result};
use serde_json::Value;
use uuid::Uuid;

use crate::executor::ExecutorKind;
use crate::metadata::{
    backup::{create_backup, join_backup_path},
    current_unix_timestamp,
    io::{atomic_write_json, read_json_value},
    schema::validate_instance,
    MetadataError, MetadataHeader, MetadataKind, MigrationReport,
    AUTOMATIC_EXECUTION_METADATA_VERSION,
};

use super::models::{
    AutomaticExecutionCursorState, AutomaticExecutionMetadata, AutomaticExecutionScriptSnapshot,
    AutomaticExecutionScriptState, AutomaticExecutionSnapshot,
    PersistedAutomaticExecutionDocumentV1, PersistedAutomaticExecutionDocumentV2,
    StoredAutomaticExecutionMetadata, AUTOMATIC_EXECUTION_METADATA_DIR_NAME,
    AUTOMATIC_EXECUTION_METADATA_FILE_NAME, DEFAULT_AUTOMATIC_EXECUTION_FILE_BASE_NAME,
    DEFAULT_AUTOMATIC_EXECUTION_FILE_EXTENSION, MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH,
};

#[derive(Debug)]
struct UnsupportedAutomaticExecutionError;

impl std::fmt::Display for UnsupportedAutomaticExecutionError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(
            "UnsupportedExecutorError: No supported executor was detected for Automatic Execution.",
        )
    }
}

impl std::error::Error for UnsupportedAutomaticExecutionError {}

fn unsupported_executor_error() -> anyhow::Error {
    UnsupportedAutomaticExecutionError.into()
}

#[cfg(test)]
pub(super) fn is_unsupported_executor_error(error: &anyhow::Error) -> bool {
    error
        .downcast_ref::<UnsupportedAutomaticExecutionError>()
        .is_some()
}

fn resolve_automatic_execution_path_at(
    executor_kind: ExecutorKind,
    macsploit_path: impl AsRef<Path>,
    opiumware_path: impl AsRef<Path>,
) -> Result<PathBuf> {
    match executor_kind {
        ExecutorKind::Macsploit => Ok(macsploit_path.as_ref().to_path_buf()),
        ExecutorKind::Opiumware => Ok(opiumware_path.as_ref().to_path_buf()),
        ExecutorKind::Unsupported => Err(unsupported_executor_error()),
    }
}

fn resolve_home_directory() -> Result<PathBuf> {
    let home_dir =
        std::env::var_os("HOME").ok_or_else(|| anyhow!("failed to resolve the home directory"))?;

    Ok(PathBuf::from(home_dir))
}

fn get_macsploit_automatic_execution_path(home_dir: &Path) -> PathBuf {
    home_dir
        .join("Documents")
        .join("Macsploit Automatic Execution")
}

fn get_opiumware_automatic_execution_path(home_dir: &Path) -> PathBuf {
    home_dir.join("Opiumware").join("autoexec")
}

pub(super) fn resolve_automatic_execution_path(executor_kind: ExecutorKind) -> Result<PathBuf> {
    let home_dir = resolve_home_directory()?;

    resolve_automatic_execution_path_at(
        executor_kind,
        get_macsploit_automatic_execution_path(&home_dir),
        get_opiumware_automatic_execution_path(&home_dir),
    )
}

fn ensure_directory(path: &Path) -> Result<()> {
    fs::create_dir_all(path)
        .with_context(|| format!("failed to create directory {}", path.display()))
}

fn ensure_file_parent_directory(path: &Path) -> Result<()> {
    match path.parent() {
        Some(parent) => ensure_directory(parent),
        None => Ok(()),
    }
}

fn get_metadata_path(automatic_execution_path: &Path) -> PathBuf {
    automatic_execution_path
        .join(AUTOMATIC_EXECUTION_METADATA_DIR_NAME)
        .join(AUTOMATIC_EXECUTION_METADATA_FILE_NAME)
}

fn split_file_name(file_name: &str) -> (&str, &str) {
    match file_name.rfind('.') {
        Some(index) if index > 0 => (&file_name[..index], &file_name[index..]),
        _ => (file_name, ""),
    }
}

fn collapse_whitespace(value: &str) -> String {
    let mut collapsed = String::with_capacity(value.len());

    for segment in value.split_whitespace() {
        if !collapsed.is_empty() {
            collapsed.push(' ');
        }

        collapsed.push_str(segment);
    }

    collapsed
}

fn sanitize_file_name(file_name: &str) -> String {
    let trimmed_name = file_name.trim().replace('\\', "/");
    let base_name = trimmed_name
        .rsplit('/')
        .next()
        .unwrap_or(trimmed_name.as_str());
    let sanitized_characters = base_name
        .chars()
        .map(|character| {
            if character.is_control() {
                ' '
            } else {
                character
            }
        })
        .collect::<String>();
    let sanitized_name = sanitized_characters
        .chars()
        .map(|character| match character {
            '<' | '>' | ':' | '"' | '|' | '?' | '*' => '-',
            _ => character,
        })
        .collect::<String>();
    let normalized_name = collapse_whitespace(sanitized_name.trim())
        .trim_start_matches('.')
        .trim()
        .to_string();

    if normalized_name.is_empty() || normalized_name == "." || normalized_name == ".." {
        String::new()
    } else {
        normalized_name
    }
}

fn is_supported_script_extension(extension: &str) -> bool {
    extension.eq_ignore_ascii_case(".lua") || extension.eq_ignore_ascii_case(".luau")
}

fn is_supported_script_file_name(file_name: &str) -> bool {
    let (_, extension) = split_file_name(file_name);
    !extension.is_empty() && is_supported_script_extension(extension)
}

pub(super) fn normalize_script_file_name(file_name: &str) -> String {
    let sanitized_file_name = sanitize_file_name(file_name);
    if sanitized_file_name.is_empty() {
        return String::new();
    }

    let (base_name, extension) = split_file_name(&sanitized_file_name);
    let normalized_extension = if extension.is_empty() {
        DEFAULT_AUTOMATIC_EXECUTION_FILE_EXTENSION
    } else if is_supported_script_extension(extension) {
        extension
    } else {
        return String::new();
    };

    if base_name.chars().count() > MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH {
        return String::new();
    }

    format!("{base_name}{normalized_extension}")
}

pub(super) fn normalize_cursor_state(
    cursor: &AutomaticExecutionCursorState,
) -> AutomaticExecutionCursorState {
    AutomaticExecutionCursorState {
        line: cursor.line.max(0),
        column: cursor.column.max(0),
        scroll_top: if cursor.scroll_top.is_finite() {
            cursor.scroll_top.max(0.0)
        } else {
            0.0
        },
    }
}

pub(super) fn create_empty_cursor_state() -> AutomaticExecutionCursorState {
    AutomaticExecutionCursorState {
        line: 0,
        column: 0,
        scroll_top: 0.0,
    }
}

pub(super) fn create_script_id(seen_ids: &HashSet<String>) -> String {
    loop {
        let next_id = Uuid::new_v4().to_string();
        if !seen_ids.contains(&next_id) {
            return next_id;
        }
    }
}

fn create_default_metadata() -> AutomaticExecutionMetadata {
    AutomaticExecutionMetadata {
        version: AUTOMATIC_EXECUTION_METADATA_VERSION,
        active_script_id: None,
        scripts: Vec::new(),
    }
}

fn automatic_execution_backup_path(
    automatic_execution_path: &Path,
    version: u8,
    timestamp: i64,
) -> PathBuf {
    join_backup_path(
        automatic_execution_path,
        ".fumi/backups/automatic-execution",
        version,
        timestamp,
    )
}

fn detect_automatic_execution_version(raw_value: &Value) -> Result<u8> {
    let version = raw_value
        .get("version")
        .and_then(Value::as_u64)
        .ok_or_else(|| MetadataError::InvalidDocument {
            kind: MetadataKind::AutomaticExecution,
            message: "missing numeric version".to_string(),
        })?;

    u8::try_from(version).map_err(|_| {
        MetadataError::UnsupportedVersion {
            kind: MetadataKind::AutomaticExecution,
            version,
        }
        .into()
    })
}

fn automatic_execution_metadata_to_stored(
    metadata: AutomaticExecutionMetadata,
) -> StoredAutomaticExecutionMetadata {
    StoredAutomaticExecutionMetadata {
        version: metadata.version,
        active_script_id: metadata.active_script_id,
        scripts: Some(metadata.scripts),
    }
}

fn automatic_execution_document_matches_runtime(
    document: &PersistedAutomaticExecutionDocumentV2,
    metadata: &AutomaticExecutionMetadata,
) -> bool {
    document.active_script_id == metadata.active_script_id && document.scripts == metadata.scripts
}

fn current_automatic_execution_document_from_runtime(
    metadata: AutomaticExecutionMetadata,
    existing_document: Option<&PersistedAutomaticExecutionDocumentV2>,
    migrated_from_version: Option<u8>,
    timestamp: i64,
) -> PersistedAutomaticExecutionDocumentV2 {
    let preserve_updated_at = existing_document.is_some_and(|document| {
        migrated_from_version.is_none()
            && automatic_execution_document_matches_runtime(document, &metadata)
    });
    let header = existing_document
        .map(|document| MetadataHeader {
            schema: crate::metadata::metadata_schema_id(
                MetadataKind::AutomaticExecution,
                AUTOMATIC_EXECUTION_METADATA_VERSION,
            )
            .to_string(),
            kind: MetadataKind::AutomaticExecution,
            version: AUTOMATIC_EXECUTION_METADATA_VERSION,
            created_at: document.header.created_at,
            updated_at: if preserve_updated_at {
                document.header.updated_at
            } else {
                timestamp
            },
            migrated_from_version: migrated_from_version.or(document.header.migrated_from_version),
            written_by_app_version: if preserve_updated_at {
                document.header.written_by_app_version.clone()
            } else {
                crate::metadata::CURRENT_APP_VERSION.to_string()
            },
        })
        .unwrap_or_else(|| {
            MetadataHeader::new(
                MetadataKind::AutomaticExecution,
                AUTOMATIC_EXECUTION_METADATA_VERSION,
                timestamp,
                timestamp,
                migrated_from_version,
            )
        });

    PersistedAutomaticExecutionDocumentV2::from_runtime(
        metadata,
        header,
        existing_document
            .map(|document| document.extra_fields.clone())
            .unwrap_or_default(),
    )
}

fn write_script_file(file_path: &Path, content: &str) -> Result<()> {
    ensure_file_parent_directory(file_path)?;
    fs::write(file_path, content)
        .with_context(|| format!("failed to write {}", file_path.display()))
}

fn read_disk_script_file_names(automatic_execution_path: &Path) -> Result<Vec<String>> {
    let mut file_names = Vec::new();

    for entry in fs::read_dir(automatic_execution_path)
        .with_context(|| format!("failed to read {}", automatic_execution_path.display()))?
    {
        let entry = entry.with_context(|| {
            format!(
                "failed to read directory entry from {}",
                automatic_execution_path.display()
            )
        })?;
        let file_type = entry
            .file_type()
            .with_context(|| format!("failed to read file type for {}", entry.path().display()))?;

        if !file_type.is_file() {
            continue;
        }

        let Some(file_name) = entry.file_name().to_str().map(str::to_owned) else {
            continue;
        };

        if !is_supported_script_file_name(&file_name) {
            continue;
        }

        file_names.push(file_name);
    }

    file_names.sort_by_cached_key(|file_name| file_name.to_lowercase());
    Ok(file_names)
}

pub(super) fn normalize_automatic_execution_metadata(
    metadata: Option<StoredAutomaticExecutionMetadata>,
    on_disk_file_names: &[String],
) -> AutomaticExecutionMetadata {
    let Some(metadata) = metadata else {
        return AutomaticExecutionMetadata {
            scripts: on_disk_file_names
                .iter()
                .map(|file_name| AutomaticExecutionScriptState {
                    id: Uuid::new_v4().to_string(),
                    file_name: file_name.clone(),
                    cursor: create_empty_cursor_state(),
                })
                .collect(),
            active_script_id: on_disk_file_names.first().map(|_| String::new()),
            version: AUTOMATIC_EXECUTION_METADATA_VERSION,
        }
        .with_repaired_active_script_id();
    };

    if metadata.version != 1 && metadata.version != AUTOMATIC_EXECUTION_METADATA_VERSION {
        return create_default_metadata();
    }

    let available_file_names: HashMap<&str, &String> = on_disk_file_names
        .iter()
        .map(|file_name| (file_name.as_str(), file_name))
        .collect();
    let mut seen_ids = HashSet::new();
    let mut seen_file_names = HashSet::new();
    let mut normalized_scripts = Vec::with_capacity(on_disk_file_names.len());

    for script in metadata.scripts.unwrap_or_default() {
        let normalized_file_name = normalize_script_file_name(&script.file_name);

        if normalized_file_name.is_empty() || !is_supported_script_file_name(&normalized_file_name)
        {
            continue;
        }

        let Some(actual_file_name) = available_file_names.get(normalized_file_name.as_str()) else {
            continue;
        };

        if seen_file_names.contains(actual_file_name.as_str()) {
            continue;
        }

        let trimmed_id = script.id.trim();
        let normalized_id = if !trimmed_id.is_empty() && !seen_ids.contains(trimmed_id) {
            trimmed_id.to_string()
        } else {
            create_script_id(&seen_ids)
        };

        seen_ids.insert(normalized_id.clone());
        seen_file_names.insert((*actual_file_name).clone());
        normalized_scripts.push(AutomaticExecutionScriptState {
            id: normalized_id,
            file_name: (*actual_file_name).clone(),
            cursor: normalize_cursor_state(&script.cursor),
        });
    }

    for file_name in on_disk_file_names {
        if seen_file_names.contains(file_name) {
            continue;
        }

        let next_id = create_script_id(&seen_ids);
        seen_ids.insert(next_id.clone());
        seen_file_names.insert(file_name.clone());
        normalized_scripts.push(AutomaticExecutionScriptState {
            id: next_id,
            file_name: file_name.clone(),
            cursor: create_empty_cursor_state(),
        });
    }

    AutomaticExecutionMetadata {
        version: AUTOMATIC_EXECUTION_METADATA_VERSION,
        active_script_id: metadata.active_script_id,
        scripts: normalized_scripts,
    }
    .with_repaired_active_script_id()
}

trait AutomaticExecutionMetadataExt {
    fn with_repaired_active_script_id(self) -> AutomaticExecutionMetadata;
}

impl AutomaticExecutionMetadataExt for AutomaticExecutionMetadata {
    fn with_repaired_active_script_id(mut self) -> AutomaticExecutionMetadata {
        self.active_script_id = self
            .active_script_id
            .filter(|script_id| self.scripts.iter().any(|script| script.id == *script_id))
            .or_else(|| self.scripts.first().map(|script| script.id.clone()));
        self
    }
}

fn migrate_automatic_execution_document(
    raw_value: Value,
    on_disk_file_names: &[String],
    timestamp: i64,
) -> Result<(
    PersistedAutomaticExecutionDocumentV2,
    AutomaticExecutionMetadata,
    Option<MigrationReport>,
)> {
    let version = detect_automatic_execution_version(&raw_value)?;

    match version {
        1 => {
            let document =
                serde_json::from_value::<PersistedAutomaticExecutionDocumentV1>(raw_value)?;
            let normalized_metadata = normalize_automatic_execution_metadata(
                Some(StoredAutomaticExecutionMetadata {
                    version: document.version,
                    active_script_id: document.active_script_id,
                    scripts: document.scripts,
                }),
                on_disk_file_names,
            );
            let current_document = PersistedAutomaticExecutionDocumentV2::from_runtime(
                normalized_metadata.clone(),
                MetadataHeader::new(
                    MetadataKind::AutomaticExecution,
                    AUTOMATIC_EXECUTION_METADATA_VERSION,
                    timestamp,
                    timestamp,
                    Some(1),
                ),
                document.extra_fields,
            );

            Ok((
                current_document,
                normalized_metadata,
                Some(MigrationReport {
                    kind: MetadataKind::AutomaticExecution,
                    from_version: 1,
                    to_version: AUTOMATIC_EXECUTION_METADATA_VERSION,
                    created_backup: false,
                }),
            ))
        }
        AUTOMATIC_EXECUTION_METADATA_VERSION => {
            let document =
                serde_json::from_value::<PersistedAutomaticExecutionDocumentV2>(raw_value.clone())?;
            validate_instance(MetadataKind::AutomaticExecution, &raw_value)?;
            let runtime_metadata = normalize_automatic_execution_metadata(
                Some(StoredAutomaticExecutionMetadata {
                    version: document.header.version,
                    active_script_id: document.active_script_id.clone(),
                    scripts: Some(document.scripts.clone()),
                }),
                on_disk_file_names,
            );
            let needs_rewrite = runtime_metadata
                != document
                    .clone()
                    .into_runtime()
                    .with_repaired_active_script_id();
            let current_document = if needs_rewrite {
                current_automatic_execution_document_from_runtime(
                    runtime_metadata.clone(),
                    Some(&document),
                    None,
                    timestamp,
                )
            } else {
                document
            };

            Ok((
                current_document,
                runtime_metadata,
                needs_rewrite.then_some(MigrationReport {
                    kind: MetadataKind::AutomaticExecution,
                    from_version: AUTOMATIC_EXECUTION_METADATA_VERSION,
                    to_version: AUTOMATIC_EXECUTION_METADATA_VERSION,
                    created_backup: false,
                }),
            ))
        }
        unsupported_version => Err(MetadataError::UnsupportedVersion {
            kind: MetadataKind::AutomaticExecution,
            version: u64::from(unsupported_version),
        }
        .into()),
    }
}

fn write_automatic_execution_document(
    automatic_execution_path: &Path,
    metadata_path: &Path,
    document: &PersistedAutomaticExecutionDocumentV2,
    existing_version: Option<u8>,
    migration_report: &mut Option<MigrationReport>,
) -> Result<()> {
    validate_instance(
        MetadataKind::AutomaticExecution,
        &serde_json::to_value(document)
            .context("failed to serialize automatic execution metadata")?,
    )?;

    if let Some(version) = existing_version {
        let timestamp = current_unix_timestamp()?;
        let created_backup = create_backup(
            metadata_path,
            &automatic_execution_backup_path(automatic_execution_path, version, timestamp),
        )?;

        if let Some(report) = migration_report {
            report.created_backup = created_backup;
        }
    }

    atomic_write_json(metadata_path, document)
}

pub(super) fn read_automatic_execution_metadata(
    automatic_execution_path: &Path,
) -> Result<AutomaticExecutionMetadata> {
    ensure_directory(automatic_execution_path)?;
    let metadata_path = get_metadata_path(automatic_execution_path);
    let on_disk_file_names = read_disk_script_file_names(automatic_execution_path)?;
    let timestamp = current_unix_timestamp()?;
    let Some(raw_value) = read_json_value(&metadata_path)? else {
        let metadata = normalize_automatic_execution_metadata(None, &on_disk_file_names);
        let document = current_automatic_execution_document_from_runtime(
            metadata.clone(),
            None,
            None,
            timestamp,
        );
        let mut migration_report = None;

        write_automatic_execution_document(
            automatic_execution_path,
            &metadata_path,
            &document,
            None,
            &mut migration_report,
        )?;

        return Ok(metadata);
    };

    let existing_version = detect_automatic_execution_version(&raw_value)?;
    let (document, metadata, mut migration_report) =
        migrate_automatic_execution_document(raw_value, &on_disk_file_names, timestamp)?;

    if migration_report.is_some() {
        write_automatic_execution_document(
            automatic_execution_path,
            &metadata_path,
            &document,
            Some(existing_version),
            &mut migration_report,
        )?;
    }

    Ok(metadata)
}

pub(super) fn write_automatic_execution_metadata(
    automatic_execution_path: &Path,
    metadata: &AutomaticExecutionMetadata,
) -> Result<()> {
    ensure_directory(automatic_execution_path)?;
    let metadata_path = get_metadata_path(automatic_execution_path);
    let timestamp = current_unix_timestamp()?;
    let existing_value = read_json_value(&metadata_path)?;
    let existing_version = existing_value
        .as_ref()
        .map(detect_automatic_execution_version)
        .transpose()?;
    let existing_document = match existing_value {
        Some(raw_value) if existing_version == Some(AUTOMATIC_EXECUTION_METADATA_VERSION) => {
            Some(serde_json::from_value::<
                PersistedAutomaticExecutionDocumentV2,
            >(raw_value)?)
        }
        _ => None,
    };
    let document = current_automatic_execution_document_from_runtime(
        normalize_automatic_execution_metadata(
            Some(automatic_execution_metadata_to_stored(metadata.clone())),
            &metadata
                .scripts
                .iter()
                .map(|script| script.file_name.clone())
                .collect::<Vec<_>>(),
        ),
        existing_document.as_ref(),
        None,
        timestamp,
    );

    if existing_document.as_ref() == Some(&document) {
        return Ok(());
    }

    let mut migration_report = None;
    write_automatic_execution_document(
        automatic_execution_path,
        &metadata_path,
        &document,
        existing_version,
        &mut migration_report,
    )
}

pub(super) fn read_automatic_execution_snapshot(
    executor_kind: ExecutorKind,
) -> Result<AutomaticExecutionSnapshot> {
    let automatic_execution_path = resolve_automatic_execution_path(executor_kind)?;
    read_automatic_execution_snapshot_at(&automatic_execution_path, executor_kind)
}

pub(super) fn read_automatic_execution_snapshot_at(
    automatic_execution_path: &Path,
    executor_kind: ExecutorKind,
) -> Result<AutomaticExecutionSnapshot> {
    ensure_directory(&automatic_execution_path)?;
    let metadata = read_automatic_execution_metadata(&automatic_execution_path)?;
    let mut scripts = Vec::with_capacity(metadata.scripts.len());
    let mut existing_script_states = Vec::with_capacity(metadata.scripts.len());

    for script in &metadata.scripts {
        let file_path = automatic_execution_path.join(&script.file_name);
        let content = match fs::read_to_string(&file_path) {
            Ok(content) => content,
            Err(error) if error.kind() == ErrorKind::NotFound => continue,
            Err(error) => {
                return Err(error)
                    .with_context(|| format!("failed to read {}", file_path.display()));
            }
        };

        scripts.push(AutomaticExecutionScriptSnapshot {
            id: script.id.clone(),
            file_name: script.file_name.clone(),
            cursor: script.cursor.clone(),
            content,
            is_dirty: false,
        });
        existing_script_states.push(script.clone());
    }

    let normalized_metadata = AutomaticExecutionMetadata {
        version: metadata.version,
        active_script_id: metadata.active_script_id.clone(),
        scripts: existing_script_states,
    }
    .with_repaired_active_script_id();

    if normalized_metadata != metadata {
        write_automatic_execution_metadata(&automatic_execution_path, &normalized_metadata)?;
    }

    Ok(AutomaticExecutionSnapshot {
        executor_kind,
        resolved_path: automatic_execution_path.display().to_string(),
        metadata: normalized_metadata,
        scripts,
    })
}

pub(super) fn find_script(
    metadata: &AutomaticExecutionMetadata,
    script_id: &str,
) -> Result<AutomaticExecutionScriptState> {
    metadata
        .scripts
        .iter()
        .find(|script| script.id == script_id)
        .cloned()
        .ok_or_else(|| anyhow!("Automatic execution script not found: {script_id}"))
}

fn ensure_unique_file_name(
    automatic_execution_path: &Path,
    metadata: &AutomaticExecutionMetadata,
    preferred_file_name: &str,
) -> String {
    let used_file_names: HashSet<&str> = metadata
        .scripts
        .iter()
        .map(|script| script.file_name.as_str())
        .collect();
    let normalized_preferred_file_name = normalize_script_file_name(preferred_file_name);
    let fallback_file_name = if normalized_preferred_file_name.is_empty() {
        format!("{DEFAULT_AUTOMATIC_EXECUTION_FILE_BASE_NAME}-1")
    } else {
        normalized_preferred_file_name
    };
    let normalized_file_name = if is_supported_script_file_name(&fallback_file_name) {
        fallback_file_name
    } else {
        format!("{fallback_file_name}{DEFAULT_AUTOMATIC_EXECUTION_FILE_EXTENSION}")
    };

    if !used_file_names.contains(normalized_file_name.as_str())
        && !automatic_execution_path
            .join(&normalized_file_name)
            .exists()
    {
        return normalized_file_name;
    }

    let (base_name, extension) = split_file_name(&normalized_file_name);
    for counter in 1..10_000 {
        let candidate_name = format!("{base_name}-{counter}{extension}");
        if !used_file_names.contains(candidate_name.as_str())
            && !automatic_execution_path.join(&candidate_name).exists()
        {
            return candidate_name;
        }
    }

    format!("{base_name}-{}{extension}", chrono_like_timestamp())
}

fn chrono_like_timestamp() -> u128 {
    use std::time::{SystemTime, UNIX_EPOCH};

    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_millis(),
        Err(_) => 0,
    }
}

pub(super) fn get_next_script_name(
    automatic_execution_path: &Path,
    metadata: &AutomaticExecutionMetadata,
) -> String {
    for counter in 1..10_000 {
        let candidate_name = format!(
            "{DEFAULT_AUTOMATIC_EXECUTION_FILE_BASE_NAME}-{counter}{DEFAULT_AUTOMATIC_EXECUTION_FILE_EXTENSION}"
        );
        if !metadata
            .scripts
            .iter()
            .any(|script| script.file_name == candidate_name)
            && !automatic_execution_path.join(&candidate_name).exists()
        {
            return candidate_name;
        }
    }

    format!(
        "{DEFAULT_AUTOMATIC_EXECUTION_FILE_BASE_NAME}-{}{DEFAULT_AUTOMATIC_EXECUTION_FILE_EXTENSION}",
        chrono_like_timestamp()
    )
}

pub(super) fn has_conflicting_script_file_name(
    metadata: &AutomaticExecutionMetadata,
    script_id: &str,
    file_name: &str,
) -> bool {
    metadata
        .scripts
        .iter()
        .any(|script| script.id != script_id && script.file_name == file_name)
}

pub(super) fn is_case_only_rename(current_file_name: &str, next_file_name: &str) -> bool {
    current_file_name != next_file_name
        && current_file_name.to_lowercase() == next_file_name.to_lowercase()
}

pub(super) fn get_temporary_rename_file_name(
    automatic_execution_path: &Path,
    metadata: &AutomaticExecutionMetadata,
    script_id: &str,
    file_name: &str,
) -> String {
    let (base_name, extension) = split_file_name(file_name);
    let temporary_name = format!("{base_name}-renaming{extension}");

    ensure_unique_file_name(
        automatic_execution_path,
        &AutomaticExecutionMetadata {
            version: metadata.version,
            active_script_id: metadata.active_script_id.clone(),
            scripts: metadata
                .scripts
                .iter()
                .filter(|script| script.id != script_id)
                .cloned()
                .collect(),
        },
        &temporary_name,
    )
}

pub(super) fn create_script(
    automatic_execution_path: &Path,
    metadata: &AutomaticExecutionMetadata,
    preferred_file_name: Option<&str>,
    initial_content: &str,
) -> Result<AutomaticExecutionScriptSnapshot> {
    let trimmed_file_name = preferred_file_name.map(str::trim).unwrap_or_default();
    let preferred_file_name = if trimmed_file_name.is_empty() {
        get_next_script_name(automatic_execution_path, metadata)
    } else {
        normalize_script_file_name(trimmed_file_name)
    };

    if !trimmed_file_name.is_empty() && preferred_file_name.is_empty() {
        return Err(anyhow!(
            "File name is invalid or exceeds {MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH} characters."
        ));
    }

    let file_name =
        ensure_unique_file_name(automatic_execution_path, metadata, &preferred_file_name);
    let existing_ids: HashSet<String> = metadata
        .scripts
        .iter()
        .map(|script| script.id.clone())
        .collect();
    let script_id = create_script_id(&existing_ids);
    let cursor = create_empty_cursor_state();

    write_script_file(&automatic_execution_path.join(&file_name), initial_content)?;

    Ok(AutomaticExecutionScriptSnapshot {
        id: script_id,
        file_name,
        cursor,
        content: initial_content.to_string(),
        is_dirty: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct TestAutomaticExecutionDir {
        path: PathBuf,
    }

    impl TestAutomaticExecutionDir {
        fn new(name: &str) -> Self {
            let unique_suffix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system clock should be after unix epoch")
                .as_nanos();
            let path = std::env::temp_dir().join(format!(
                "fumi-automatic-execution-tests-{name}-{}-{unique_suffix}",
                std::process::id()
            ));

            Self { path }
        }

        fn path(&self) -> &Path {
            &self.path
        }
    }

    impl Drop for TestAutomaticExecutionDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    fn cursor(line: i64, column: i64, scroll_top: f64) -> AutomaticExecutionCursorState {
        AutomaticExecutionCursorState {
            line,
            column,
            scroll_top,
        }
    }

    fn script(
        id: &str,
        file_name: &str,
        cursor: AutomaticExecutionCursorState,
    ) -> AutomaticExecutionScriptState {
        AutomaticExecutionScriptState {
            id: id.to_string(),
            file_name: file_name.to_string(),
            cursor,
        }
    }

    #[test]
    fn resolves_executor_paths_with_fixed_locations() -> anyhow::Result<()> {
        let path = resolve_automatic_execution_path_at(
            ExecutorKind::Macsploit,
            "/Users/dayte/Documents/Macsploit Automatic Execution",
            "/Users/dayte/Opiumware/autoexec",
        )?;
        assert_eq!(
            path.display().to_string(),
            "/Users/dayte/Documents/Macsploit Automatic Execution"
        );

        let path = resolve_automatic_execution_path_at(
            ExecutorKind::Opiumware,
            "/Users/dayte/Documents/Macsploit Automatic Execution",
            "/Users/dayte/Opiumware/autoexec",
        )?;
        assert_eq!(
            path.display().to_string(),
            "/Users/dayte/Opiumware/autoexec"
        );

        let error =
            resolve_automatic_execution_path_at(ExecutorKind::Unsupported, "ignored", "ignored")
                .expect_err("unsupported executor should fail");
        assert!(is_unsupported_executor_error(&error));
        Ok(())
    }

    #[test]
    fn resolves_executor_paths_from_home_directory() -> anyhow::Result<()> {
        let home_dir = PathBuf::from("/Users/example");

        assert_eq!(
            get_macsploit_automatic_execution_path(&home_dir),
            PathBuf::from("/Users/example/Documents/Macsploit Automatic Execution")
        );
        assert_eq!(
            get_opiumware_automatic_execution_path(&home_dir),
            PathBuf::from("/Users/example/Opiumware/autoexec")
        );

        Ok(())
    }

    #[test]
    fn read_automatic_execution_metadata_creates_missing_directory() -> anyhow::Result<()> {
        let automatic_execution_dir = TestAutomaticExecutionDir::new("bootstrap");
        let metadata = read_automatic_execution_metadata(automatic_execution_dir.path())?;

        assert!(automatic_execution_dir.path().is_dir());
        assert_eq!(metadata.version, AUTOMATIC_EXECUTION_METADATA_VERSION);
        assert!(get_metadata_path(automatic_execution_dir.path()).exists());
        Ok(())
    }

    #[test]
    fn normalize_metadata_repairs_invalid_entries_and_appends_disk_files() {
        let on_disk_file_names = vec![
            "alpha.lua".to_string(),
            "beta.luau".to_string(),
            "zeta.lua".to_string(),
        ];
        let metadata = normalize_automatic_execution_metadata(
            Some(StoredAutomaticExecutionMetadata {
                version: 1,
                active_script_id: Some("missing".to_string()),
                scripts: Some(vec![
                    script(
                        "script-1",
                        " folders/alpha ",
                        cursor(-3, -7, f64::NEG_INFINITY),
                    ),
                    script("", "beta.txt", cursor(1, 2, 3.0)),
                    script("script-3", "alpha.lua", cursor(1, 2, 3.0)),
                ]),
            }),
            &on_disk_file_names,
        );

        assert_eq!(metadata.version, AUTOMATIC_EXECUTION_METADATA_VERSION);
        assert_eq!(metadata.scripts.len(), 3);
        assert_eq!(metadata.scripts[0].id, "script-1");
        assert_eq!(metadata.scripts[0].file_name, "alpha.lua");
        assert_eq!(metadata.scripts[0].cursor, create_empty_cursor_state());
        assert_eq!(metadata.scripts[1].file_name, "beta.luau");
        assert_eq!(metadata.scripts[2].file_name, "zeta.lua");
        assert_eq!(
            metadata.active_script_id.as_deref(),
            Some(metadata.scripts[0].id.as_str())
        );
    }

    #[test]
    fn read_metadata_ignores_non_lua_files() -> anyhow::Result<()> {
        let automatic_execution_dir = TestAutomaticExecutionDir::new("ignore-files");
        ensure_directory(automatic_execution_dir.path())?;
        write_script_file(
            &automatic_execution_dir.path().join("alpha.lua"),
            "print('a')",
        )?;
        write_script_file(
            &automatic_execution_dir.path().join("beta.luau"),
            "print('b')",
        )?;
        write_script_file(
            &automatic_execution_dir.path().join("notes.txt"),
            "ignore me",
        )?;

        let metadata = read_automatic_execution_metadata(automatic_execution_dir.path())?;

        assert_eq!(metadata.scripts.len(), 2);
        assert_eq!(
            metadata
                .scripts
                .iter()
                .map(|script| script.file_name.as_str())
                .collect::<Vec<_>>(),
            vec!["alpha.lua", "beta.luau"]
        );
        Ok(())
    }

    #[test]
    fn create_save_rename_and_delete_are_consistent() -> anyhow::Result<()> {
        let automatic_execution_dir = TestAutomaticExecutionDir::new("crud");
        let metadata = read_automatic_execution_metadata(automatic_execution_dir.path())?;
        let created_script = create_script(
            automatic_execution_dir.path(),
            &metadata,
            Some("alpha"),
            "print('alpha')",
        )?;

        let mut next_metadata = metadata.clone();
        next_metadata.scripts.push(AutomaticExecutionScriptState {
            id: created_script.id.clone(),
            file_name: created_script.file_name.clone(),
            cursor: created_script.cursor.clone(),
        });
        next_metadata.active_script_id = Some(created_script.id.clone());
        write_automatic_execution_metadata(automatic_execution_dir.path(), &next_metadata)?;

        let read_metadata = read_automatic_execution_metadata(automatic_execution_dir.path())?;
        assert_eq!(read_metadata.scripts.len(), 1);
        assert!(automatic_execution_dir.path().join("alpha.lua").exists());

        write_script_file(
            &automatic_execution_dir.path().join("alpha.lua"),
            "print('saved')",
        )?;
        let renamed_file = automatic_execution_dir.path().join("renamed.lua");
        fs::rename(
            automatic_execution_dir.path().join("alpha.lua"),
            &renamed_file,
        )?;
        write_automatic_execution_metadata(
            automatic_execution_dir.path(),
            &AutomaticExecutionMetadata {
                version: 1,
                active_script_id: Some(created_script.id.clone()),
                scripts: vec![AutomaticExecutionScriptState {
                    id: created_script.id.clone(),
                    file_name: "renamed.lua".to_string(),
                    cursor: cursor(4, 2, 12.5),
                }],
            },
        )?;

        let snapshot = read_automatic_execution_snapshot_at(
            automatic_execution_dir.path(),
            ExecutorKind::Macsploit,
        )?;
        assert_eq!(
            snapshot.resolved_path,
            automatic_execution_dir.path().display().to_string()
        );
        assert_eq!(snapshot.scripts.len(), 1);
        assert_eq!(snapshot.scripts[0].file_name, "renamed.lua");
        assert_eq!(
            snapshot.metadata.active_script_id,
            Some(created_script.id.clone())
        );

        fs::remove_file(&renamed_file)?;
        let cleaned_metadata = read_automatic_execution_metadata(automatic_execution_dir.path())?;
        assert!(cleaned_metadata.scripts.is_empty());
        assert!(cleaned_metadata.active_script_id.is_none());
        Ok(())
    }
}
