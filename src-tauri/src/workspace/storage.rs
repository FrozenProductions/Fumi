use std::{
    collections::{HashMap, HashSet},
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
    sync::{Arc, Mutex, OnceLock},
};

use anyhow::{anyhow, Context, Result};
use serde_json::Value;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

use crate::metadata::{
    backup::{create_backup, join_backup_path},
    current_unix_timestamp,
    io::{atomic_write_json, ensure_file_parent_directory, read_json_file, read_json_value},
    schema::validate_instance,
    MetadataError, MetadataHeader, MetadataKind, MetadataReadResult, MigrationReport,
    CURRENT_WORKSPACE_METADATA_VERSION,
};

use super::models::{
    PersistedWorkspaceDocumentV1, PersistedWorkspaceDocumentV2, PersistedWorkspaceDocumentV3,
    PersistedWorkspaceDocumentV4, PersistedWorkspaceDocumentV5, StoredAppState,
    StoredWorkspaceMetadata, WorkspaceCursorState, WorkspaceExecutionHistoryEntry,
    WorkspaceMetadata, WorkspacePaneId, WorkspaceSnapshot, WorkspaceSplitView,
    WorkspaceTabSnapshot, WorkspaceTabState, APP_STATE_FILE_NAME, DEFAULT_WORKSPACE_FILE_BASE_NAME,
    DEFAULT_WORKSPACE_FILE_EXTENSION, DEFAULT_WORKSPACE_SPLIT_RATIO, LEGACY_STATE_DIRECTORIES,
    MAX_WORKSPACE_EXECUTION_HISTORY_ENTRIES, MAX_WORKSPACE_SPLIT_RATIO,
    MAX_WORKSPACE_TAB_NAME_LENGTH, MIN_WORKSPACE_SPLIT_RATIO, WORKSPACE_METADATA_DIR_NAME,
    WORKSPACE_METADATA_FILE_NAME, WORKSPACE_METADATA_VERSION, WORKSPACE_MISSING_ERROR_MESSAGE,
};

#[derive(Debug)]
struct WorkspaceMissingError;

impl std::fmt::Display for WorkspaceMissingError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(WORKSPACE_MISSING_ERROR_MESSAGE)
    }
}

impl std::error::Error for WorkspaceMissingError {}

static WORKSPACE_METADATA_APPEND_LOCKS: OnceLock<Mutex<HashMap<PathBuf, Arc<Mutex<()>>>>> =
    OnceLock::new();

fn workspace_missing_error() -> anyhow::Error {
    WorkspaceMissingError.into()
}

pub(super) fn is_workspace_missing_error(error: &anyhow::Error) -> bool {
    error.downcast_ref::<WorkspaceMissingError>().is_some()
}

pub(super) fn ensure_workspace_exists(workspace_path: &Path) -> Result<()> {
    if !workspace_path.is_dir() {
        return Err(workspace_missing_error());
    }

    Ok(())
}

fn get_workspace_metadata_path(workspace_path: &Path) -> PathBuf {
    workspace_path
        .join(WORKSPACE_METADATA_DIR_NAME)
        .join(WORKSPACE_METADATA_FILE_NAME)
}

fn get_app_state_path<R: tauri::Runtime>(app: &AppHandle<R>) -> Result<PathBuf> {
    Ok(app
        .path()
        .app_local_data_dir()
        .context("failed to resolve app local data directory")?
        .join(APP_STATE_FILE_NAME))
}

fn split_workspace_file_name(file_name: &str) -> (&str, &str) {
    match file_name.rfind('.') {
        Some(index) if index > 0 => (&file_name[..index], &file_name[index..]),
        _ => (file_name, ""),
    }
}

fn get_workspace_name(workspace_path: &Path) -> String {
    workspace_path
        .file_name()
        .and_then(|value| value.to_str())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| workspace_path.display().to_string())
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

fn ensure_workspace_extension(file_name: &str) -> String {
    let (_, extension) = split_workspace_file_name(file_name);
    if extension.is_empty() {
        format!("{file_name}{DEFAULT_WORKSPACE_FILE_EXTENSION}")
    } else {
        file_name.to_string()
    }
}

pub(super) fn normalize_new_workspace_file_name(file_name: &str) -> String {
    let sanitized_file_name = sanitize_file_name(file_name);
    if sanitized_file_name.is_empty() {
        return String::new();
    }

    let normalized_file_name = ensure_workspace_extension(&sanitized_file_name);
    let (base_name, _) = split_workspace_file_name(&normalized_file_name);
    if base_name.chars().count() > MAX_WORKSPACE_TAB_NAME_LENGTH {
        return String::new();
    }

    normalized_file_name
}

pub(super) fn create_workspace_tab_id(seen_tab_ids: &HashSet<String>) -> String {
    loop {
        let next_id = Uuid::new_v4().to_string();
        if !seen_tab_ids.contains(&next_id) {
            return next_id;
        }
    }
}

fn create_default_metadata() -> WorkspaceMetadata {
    WorkspaceMetadata {
        version: WORKSPACE_METADATA_VERSION,
        active_tab_id: None,
        split_view: None,
        tabs: Vec::new(),
        archived_tabs: Vec::new(),
        execution_history: Vec::new(),
    }
}

fn workspace_backup_path(workspace_path: &Path, version: u8, timestamp: i64) -> PathBuf {
    join_backup_path(
        workspace_path,
        ".fumi/backups/workspace",
        version,
        timestamp,
    )
}

fn detect_workspace_metadata_version(raw_value: &Value) -> Result<u8> {
    let version = raw_value
        .get("version")
        .and_then(Value::as_u64)
        .ok_or_else(|| MetadataError::InvalidDocument {
            kind: MetadataKind::Workspace,
            message: "missing numeric version".to_string(),
        })?;

    u8::try_from(version).map_err(|_| {
        MetadataError::UnsupportedVersion {
            kind: MetadataKind::Workspace,
            version,
        }
        .into()
    })
}

fn workspace_metadata_to_stored(metadata: WorkspaceMetadata) -> StoredWorkspaceMetadata {
    StoredWorkspaceMetadata {
        version: metadata.version,
        active_tab_id: metadata.active_tab_id,
        split_view: metadata.split_view,
        tabs: Some(metadata.tabs),
        archived_tabs: Some(metadata.archived_tabs),
        execution_history: Some(metadata.execution_history),
    }
}

fn workspace_document_matches_runtime(
    document: &PersistedWorkspaceDocumentV5,
    metadata: &WorkspaceMetadata,
) -> bool {
    document.active_tab_id == metadata.active_tab_id
        && document.split_view == metadata.split_view
        && document.tabs == metadata.tabs
        && document.archived_tabs == metadata.archived_tabs
        && document.execution_history == metadata.execution_history
}

fn stored_workspace_from_v1(document: PersistedWorkspaceDocumentV1) -> StoredWorkspaceMetadata {
    StoredWorkspaceMetadata {
        version: document.version,
        active_tab_id: document.active_tab_id,
        split_view: None,
        tabs: document.tabs,
        archived_tabs: None,
        execution_history: None,
    }
}

fn stored_workspace_from_v2(document: PersistedWorkspaceDocumentV2) -> StoredWorkspaceMetadata {
    StoredWorkspaceMetadata {
        version: document.version,
        active_tab_id: document.active_tab_id,
        split_view: None,
        tabs: document.tabs,
        archived_tabs: document.archived_tabs,
        execution_history: None,
    }
}

fn stored_workspace_from_v3(document: PersistedWorkspaceDocumentV3) -> StoredWorkspaceMetadata {
    StoredWorkspaceMetadata {
        version: document.version,
        active_tab_id: document.active_tab_id,
        split_view: document.split_view,
        tabs: document.tabs,
        archived_tabs: document.archived_tabs,
        execution_history: None,
    }
}

fn stored_workspace_from_v4(document: PersistedWorkspaceDocumentV4) -> StoredWorkspaceMetadata {
    StoredWorkspaceMetadata {
        version: document.version,
        active_tab_id: document.active_tab_id,
        split_view: document.split_view,
        tabs: document.tabs,
        archived_tabs: document.archived_tabs,
        execution_history: document.execution_history,
    }
}

fn current_workspace_document_from_runtime(
    metadata: WorkspaceMetadata,
    existing_document: Option<&PersistedWorkspaceDocumentV5>,
    migrated_from_version: Option<u8>,
    timestamp: i64,
) -> PersistedWorkspaceDocumentV5 {
    let preserve_updated_at = existing_document.is_some_and(|document| {
        migrated_from_version.is_none() && workspace_document_matches_runtime(document, &metadata)
    });
    let header = existing_document
        .map(|document| MetadataHeader {
            schema: crate::metadata::metadata_schema_id(
                MetadataKind::Workspace,
                CURRENT_WORKSPACE_METADATA_VERSION,
            )
            .to_string(),
            kind: MetadataKind::Workspace,
            version: CURRENT_WORKSPACE_METADATA_VERSION,
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
                MetadataKind::Workspace,
                CURRENT_WORKSPACE_METADATA_VERSION,
                timestamp,
                timestamp,
                migrated_from_version,
            )
        });

    PersistedWorkspaceDocumentV5::from_runtime(
        metadata,
        header,
        existing_document
            .map(|document| document.extra_fields.clone())
            .unwrap_or_default(),
    )
}

fn migrate_workspace_document(
    raw_value: Value,
    version: u8,
    timestamp: i64,
) -> Result<(
    PersistedWorkspaceDocumentV5,
    WorkspaceMetadata,
    Option<MigrationReport>,
)> {
    let (stored_metadata, extra_fields, migrated_from_version) = match version {
        1 => {
            let document = serde_json::from_value::<PersistedWorkspaceDocumentV1>(raw_value)?;
            let extra_fields = document.extra_fields.clone();
            (stored_workspace_from_v1(document), extra_fields, Some(1))
        }
        2 => {
            let document = serde_json::from_value::<PersistedWorkspaceDocumentV2>(raw_value)?;
            let extra_fields = document.extra_fields.clone();
            (stored_workspace_from_v2(document), extra_fields, Some(2))
        }
        3 => {
            let document = serde_json::from_value::<PersistedWorkspaceDocumentV3>(raw_value)?;
            let extra_fields = document.extra_fields.clone();
            (stored_workspace_from_v3(document), extra_fields, Some(3))
        }
        4 => {
            let document = serde_json::from_value::<PersistedWorkspaceDocumentV4>(raw_value)?;
            let extra_fields = document.extra_fields.clone();
            (stored_workspace_from_v4(document), extra_fields, Some(4))
        }
        CURRENT_WORKSPACE_METADATA_VERSION => {
            let document =
                serde_json::from_value::<PersistedWorkspaceDocumentV5>(raw_value.clone())?;
            validate_instance(MetadataKind::Workspace, &raw_value)?;
            let runtime_metadata = normalize_workspace_metadata(Some(
                workspace_metadata_to_stored(document.clone().into_runtime()),
            ));
            let needs_rewrite = runtime_metadata != document.clone().into_runtime();
            let current_document = if needs_rewrite {
                current_workspace_document_from_runtime(
                    runtime_metadata.clone(),
                    Some(&document),
                    None,
                    timestamp,
                )
            } else {
                document
            };

            return Ok((
                current_document,
                runtime_metadata,
                needs_rewrite.then_some(MigrationReport {
                    kind: MetadataKind::Workspace,
                    from_version: CURRENT_WORKSPACE_METADATA_VERSION,
                    to_version: CURRENT_WORKSPACE_METADATA_VERSION,
                    created_backup: false,
                }),
            ));
        }
        unsupported_version => {
            return Err(MetadataError::UnsupportedVersion {
                kind: MetadataKind::Workspace,
                version: u64::from(unsupported_version),
            }
            .into());
        }
    };

    let runtime_metadata = normalize_workspace_metadata(Some(stored_metadata));
    let current_document = PersistedWorkspaceDocumentV5::from_runtime(
        runtime_metadata.clone(),
        MetadataHeader::new(
            MetadataKind::Workspace,
            CURRENT_WORKSPACE_METADATA_VERSION,
            timestamp,
            timestamp,
            migrated_from_version,
        ),
        extra_fields,
    );

    Ok((
        current_document,
        runtime_metadata,
        migrated_from_version.map(|from_version| MigrationReport {
            kind: MetadataKind::Workspace,
            from_version,
            to_version: CURRENT_WORKSPACE_METADATA_VERSION,
            created_backup: false,
        }),
    ))
}

fn write_workspace_document(
    workspace_path: &Path,
    metadata_path: &Path,
    document: &PersistedWorkspaceDocumentV5,
    existing_version: Option<u8>,
    migration_report: &mut Option<MigrationReport>,
) -> Result<()> {
    validate_instance(
        MetadataKind::Workspace,
        &serde_json::to_value(document).context("failed to serialize workspace metadata")?,
    )?;

    if let Some(version) = existing_version {
        let timestamp = current_unix_timestamp()?;
        let created_backup = create_backup(
            metadata_path,
            &workspace_backup_path(workspace_path, version, timestamp),
        )?;

        if let Some(report) = migration_report {
            report.created_backup = created_backup;
        }
    }

    atomic_write_json(metadata_path, document)
}

fn normalize_workspace_execution_history(
    execution_history: Option<Vec<WorkspaceExecutionHistoryEntry>>,
) -> Vec<WorkspaceExecutionHistoryEntry> {
    execution_history
        .unwrap_or_default()
        .into_iter()
        .take(MAX_WORKSPACE_EXECUTION_HISTORY_ENTRIES)
        .collect()
}

fn normalize_split_view(
    split_view: Option<WorkspaceSplitView>,
    open_tab_ids: &HashSet<String>,
) -> Option<WorkspaceSplitView> {
    let split = split_view?;

    let primary_valid = open_tab_ids.contains(&split.primary_tab_id);
    let secondary_valid = open_tab_ids.contains(&split.secondary_tab_id);
    let not_same = split.primary_tab_id != split.secondary_tab_id;

    if !primary_valid || !secondary_valid || !not_same {
        return None;
    }

    let mut normalized_secondary_tab_ids = split
        .secondary_tab_ids
        .into_iter()
        .filter(|id| open_tab_ids.contains(id) && id != &split.primary_tab_id)
        .collect::<Vec<_>>();

    if !normalized_secondary_tab_ids.contains(&split.secondary_tab_id) {
        normalized_secondary_tab_ids.insert(0, split.secondary_tab_id.clone());
    }

    let normalized_split_ratio = if split.split_ratio.is_finite() {
        split
            .split_ratio
            .clamp(MIN_WORKSPACE_SPLIT_RATIO, MAX_WORKSPACE_SPLIT_RATIO)
    } else {
        DEFAULT_WORKSPACE_SPLIT_RATIO
    };

    Some(WorkspaceSplitView {
        secondary_tab_ids: normalized_secondary_tab_ids,
        split_ratio: normalized_split_ratio,
        ..split
    })
}

pub(super) fn normalize_cursor_state(cursor: &WorkspaceCursorState) -> WorkspaceCursorState {
    WorkspaceCursorState {
        line: cursor.line.max(0),
        column: cursor.column.max(0),
        scroll_top: if cursor.scroll_top.is_finite() {
            cursor.scroll_top.max(0.0)
        } else {
            0.0
        },
    }
}

fn normalize_workspace_tab_state(
    tab: &WorkspaceTabState,
    seen_tab_ids: &HashSet<String>,
) -> Option<WorkspaceTabState> {
    let sanitized_file_name = sanitize_file_name(&tab.file_name);
    if sanitized_file_name.is_empty() {
        return None;
    }

    let normalized_file_name = ensure_workspace_extension(&sanitized_file_name);
    let trimmed_id = tab.id.trim();
    let normalized_id = if !trimmed_id.is_empty() && !seen_tab_ids.contains(trimmed_id) {
        trimmed_id.to_string()
    } else {
        create_workspace_tab_id(seen_tab_ids)
    };

    Some(WorkspaceTabState {
        id: normalized_id,
        file_name: normalized_file_name,
        cursor: normalize_cursor_state(&tab.cursor),
        archived_at: tab.archived_at,
    })
}

fn normalize_workspace_tab_collection(
    tabs: Option<Vec<WorkspaceTabState>>,
    seen_tab_ids: &mut HashSet<String>,
    seen_file_names: &mut HashSet<String>,
) -> Vec<WorkspaceTabState> {
    let tabs = tabs.unwrap_or_default();
    let mut normalized_tabs = Vec::with_capacity(tabs.len());

    for tab in tabs {
        let Some(normalized_tab) = normalize_workspace_tab_state(&tab, seen_tab_ids) else {
            continue;
        };

        if seen_file_names.contains(&normalized_tab.file_name) {
            continue;
        }

        seen_tab_ids.insert(normalized_tab.id.clone());
        seen_file_names.insert(normalized_tab.file_name.clone());
        normalized_tabs.push(normalized_tab);
    }

    normalized_tabs
}

pub(super) fn normalize_workspace_metadata(
    metadata: Option<StoredWorkspaceMetadata>,
) -> WorkspaceMetadata {
    let Some(metadata) = metadata else {
        return create_default_metadata();
    };

    if metadata.version != 1
        && metadata.version != 2
        && metadata.version != 3
        && metadata.version != WORKSPACE_METADATA_VERSION
    {
        return create_default_metadata();
    }

    let mut seen_tab_ids = HashSet::new();
    let mut seen_file_names = HashSet::new();
    let normalized_tabs =
        normalize_workspace_tab_collection(metadata.tabs, &mut seen_tab_ids, &mut seen_file_names);
    let normalized_archived_tabs = if metadata.version >= 2 {
        normalize_workspace_tab_collection(
            metadata.archived_tabs,
            &mut seen_tab_ids,
            &mut seen_file_names,
        )
    } else {
        Vec::new()
    };

    let open_tab_ids: HashSet<String> = normalized_tabs.iter().map(|t| t.id.clone()).collect();
    let normalized_split_view = if metadata.version >= 3 {
        normalize_split_view(metadata.split_view, &open_tab_ids)
    } else {
        None
    };
    let normalized_execution_history = if metadata.version >= WORKSPACE_METADATA_VERSION {
        normalize_workspace_execution_history(metadata.execution_history)
    } else {
        Vec::new()
    };

    let active_tab_id = match &normalized_split_view {
        Some(split) => {
            let focused_id = match split.focused_pane {
                WorkspacePaneId::Primary => &split.primary_tab_id,
                WorkspacePaneId::Secondary => &split.secondary_tab_id,
            };
            Some(focused_id.clone())
        }
        None => metadata
            .active_tab_id
            .filter(|id| open_tab_ids.contains(id.as_str()))
            .or_else(|| normalized_tabs.first().map(|tab| tab.id.clone())),
    };

    WorkspaceMetadata {
        version: WORKSPACE_METADATA_VERSION,
        active_tab_id,
        split_view: normalized_split_view,
        tabs: normalized_tabs,
        archived_tabs: normalized_archived_tabs,
        execution_history: normalized_execution_history,
    }
}

#[cfg(test)]
fn write_json_file<T: serde::Serialize>(file_path: &Path, value: &T) -> Result<()> {
    let json_value = serde_json::to_value(value).context("failed to serialize json payload")?;
    let is_workspace_metadata_path = file_path.file_name().and_then(|value| value.to_str())
        == Some(WORKSPACE_METADATA_FILE_NAME);

    if is_workspace_metadata_path
        && json_value.get("$schema").is_none()
        && json_value.get("version").and_then(Value::as_u64)
            == Some(u64::from(WORKSPACE_METADATA_VERSION))
    {
        let metadata = serde_json::from_value::<WorkspaceMetadata>(json_value)?;
        let workspace_path = file_path
            .parent()
            .and_then(Path::parent)
            .context("failed to resolve workspace root for metadata file")?;

        return write_workspace_metadata(workspace_path, &metadata);
    }

    atomic_write_json(file_path, value)
}

fn read_workspace_metadata_impl(
    workspace_path: &Path,
    persist_normalized_metadata: bool,
) -> Result<MetadataReadResult<WorkspaceMetadata>> {
    ensure_workspace_exists(workspace_path)?;
    let metadata_path = get_workspace_metadata_path(workspace_path);
    let timestamp = current_unix_timestamp()?;
    let Some(raw_value) = read_json_value(&metadata_path)? else {
        let value = create_default_metadata();
        let document =
            current_workspace_document_from_runtime(value.clone(), None, None, timestamp);

        if persist_normalized_metadata {
            let mut migration_report = None;
            write_workspace_document(
                workspace_path,
                &metadata_path,
                &document,
                None,
                &mut migration_report,
            )?;
        }

        return Ok(MetadataReadResult {
            value,
            wrote_document: persist_normalized_metadata,
            migration_report: None,
        });
    };

    let version = detect_workspace_metadata_version(&raw_value)?;
    let (document, value, mut migration_report) =
        migrate_workspace_document(raw_value, version, timestamp)?;
    let should_write = migration_report.is_some();

    if persist_normalized_metadata && should_write {
        write_workspace_document(
            workspace_path,
            &metadata_path,
            &document,
            Some(version),
            &mut migration_report,
        )?;
    }

    Ok(MetadataReadResult {
        value,
        wrote_document: persist_normalized_metadata && should_write,
        migration_report,
    })
}

fn get_workspace_metadata_append_lock(workspace_path: &Path) -> Result<Arc<Mutex<()>>> {
    let registry = WORKSPACE_METADATA_APPEND_LOCKS.get_or_init(|| Mutex::new(HashMap::new()));
    let mut registry_guard = registry
        .lock()
        .map_err(|_| anyhow!("workspace metadata append lock registry poisoned"))?;

    Ok(Arc::clone(
        registry_guard
            .entry(workspace_path.to_path_buf())
            .or_insert_with(|| Arc::new(Mutex::new(()))),
    ))
}

pub(super) fn read_workspace_metadata(workspace_path: &Path) -> Result<WorkspaceMetadata> {
    Ok(read_workspace_metadata_impl(workspace_path, true)?.value)
}

pub(super) fn write_workspace_metadata(
    workspace_path: &Path,
    metadata: &WorkspaceMetadata,
) -> Result<()> {
    ensure_workspace_exists(workspace_path)?;
    let metadata_path = get_workspace_metadata_path(workspace_path);
    let timestamp = current_unix_timestamp()?;
    let existing_value = read_json_value(&metadata_path)?;
    let existing_version = existing_value
        .as_ref()
        .map(detect_workspace_metadata_version)
        .transpose()?;
    let existing_document = match existing_value {
        Some(raw_value) if existing_version == Some(CURRENT_WORKSPACE_METADATA_VERSION) => Some(
            serde_json::from_value::<PersistedWorkspaceDocumentV5>(raw_value)?,
        ),
        _ => None,
    };
    let document = current_workspace_document_from_runtime(
        normalize_workspace_metadata(Some(workspace_metadata_to_stored(metadata.clone()))),
        existing_document.as_ref(),
        None,
        timestamp,
    );

    if existing_document.as_ref() == Some(&document) {
        return Ok(());
    }

    let mut migration_report = None;

    write_workspace_document(
        workspace_path,
        &metadata_path,
        &document,
        existing_version,
        &mut migration_report,
    )
}

pub(super) fn append_workspace_execution_history(
    workspace_path: &Path,
    entry: WorkspaceExecutionHistoryEntry,
) -> Result<Vec<WorkspaceExecutionHistoryEntry>> {
    let append_lock = get_workspace_metadata_append_lock(workspace_path)?;
    let _append_guard = append_lock
        .lock()
        .map_err(|_| anyhow!("workspace metadata append lock poisoned"))?;
    let metadata = read_workspace_metadata_impl(workspace_path, false)?.value;
    let next_execution_history = normalize_workspace_execution_history(Some(
        std::iter::once(entry)
            .chain(metadata.execution_history)
            .collect(),
    ));
    let next_metadata = WorkspaceMetadata {
        version: metadata.version,
        active_tab_id: metadata.active_tab_id,
        split_view: metadata.split_view,
        tabs: metadata.tabs,
        archived_tabs: metadata.archived_tabs,
        execution_history: next_execution_history.clone(),
    };

    write_workspace_metadata(workspace_path, &next_metadata)?;

    Ok(next_execution_history)
}

fn import_legacy_app_state<R: tauri::Runtime>(
    app_state_path: &Path,
    app: &AppHandle<R>,
) -> Result<Option<StoredAppState>> {
    let current_dir = get_app_state_path(app)?
        .parent()
        .map(Path::to_path_buf)
        .context("failed to resolve parent app state directory")?;
    let parent_dir = current_dir
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or(current_dir);

    for directory_name in LEGACY_STATE_DIRECTORIES {
        let legacy_path = parent_dir.join(directory_name).join(APP_STATE_FILE_NAME);
        if legacy_path == app_state_path {
            continue;
        }

        let Some(legacy_state) = read_json_file::<StoredAppState>(&legacy_path)? else {
            continue;
        };

        atomic_write_json(app_state_path, &legacy_state)?;
        return Ok(Some(legacy_state));
    }

    Ok(None)
}

pub(super) fn read_app_state<R: tauri::Runtime>(app: &AppHandle<R>) -> Result<StoredAppState> {
    let app_state_path = get_app_state_path(app)?;
    if let Some(stored_state) = read_json_file::<StoredAppState>(&app_state_path)? {
        return Ok(StoredAppState {
            last_workspace_path: stored_state.last_workspace_path,
        });
    }

    if let Some(legacy_state) = import_legacy_app_state(&app_state_path, app)? {
        return Ok(StoredAppState {
            last_workspace_path: legacy_state.last_workspace_path,
        });
    }

    Ok(StoredAppState {
        last_workspace_path: None,
    })
}

fn write_app_state<R: tauri::Runtime>(
    app: &AppHandle<R>,
    app_state: &StoredAppState,
) -> Result<()> {
    atomic_write_json(&get_app_state_path(app)?, app_state)
}

pub(super) fn persist_workspace_launch_state<R: tauri::Runtime>(
    app: &AppHandle<R>,
    workspace_path: &Path,
) -> Result<()> {
    write_app_state(
        app,
        &StoredAppState {
            last_workspace_path: Some(workspace_path.display().to_string()),
        },
    )
}

pub(super) fn clear_workspace_launch_state<R: tauri::Runtime>(app: &AppHandle<R>) -> Result<()> {
    write_app_state(
        app,
        &StoredAppState {
            last_workspace_path: None,
        },
    )
}

pub(super) fn ensure_unique_file_name(
    workspace_path: &Path,
    metadata: &WorkspaceMetadata,
    preferred_file_name: &str,
) -> String {
    let mut used_file_names = HashSet::new();
    for tab in &metadata.tabs {
        used_file_names.insert(tab.file_name.clone());
    }
    for archived_tab in &metadata.archived_tabs {
        used_file_names.insert(archived_tab.file_name.clone());
    }

    let trimmed_file_name = sanitize_file_name(preferred_file_name);
    let fallback_file_name = if trimmed_file_name.is_empty() {
        format!("{DEFAULT_WORKSPACE_FILE_BASE_NAME}-1")
    } else {
        trimmed_file_name
    };
    let extension_normalized_file_name = ensure_workspace_extension(&fallback_file_name);

    if !used_file_names.contains(&extension_normalized_file_name)
        && !workspace_path
            .join(&extension_normalized_file_name)
            .exists()
    {
        return extension_normalized_file_name;
    }

    let (base_name, extension) = split_workspace_file_name(&extension_normalized_file_name);
    for counter in 1..10_000 {
        let candidate_name = format!("{base_name}-{counter}{extension}");
        if !used_file_names.contains(&candidate_name)
            && !workspace_path.join(&candidate_name).exists()
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

pub(super) fn get_next_script_name(workspace_path: &Path, metadata: &WorkspaceMetadata) -> String {
    for counter in 1..10_000 {
        let candidate_name = format!(
            "{DEFAULT_WORKSPACE_FILE_BASE_NAME}-{counter}{DEFAULT_WORKSPACE_FILE_EXTENSION}"
        );
        if !metadata
            .tabs
            .iter()
            .any(|tab| tab.file_name == candidate_name)
            && !workspace_path.join(&candidate_name).exists()
        {
            return candidate_name;
        }
    }

    format!(
        "{DEFAULT_WORKSPACE_FILE_BASE_NAME}-{}{DEFAULT_WORKSPACE_FILE_EXTENSION}",
        chrono_like_timestamp()
    )
}

pub(super) fn has_conflicting_workspace_file_name(
    metadata: &WorkspaceMetadata,
    tab_id: &str,
    file_name: &str,
) -> bool {
    metadata
        .tabs
        .iter()
        .chain(metadata.archived_tabs.iter())
        .any(|tab| tab.id != tab_id && tab.file_name == file_name)
}

pub(super) fn is_case_only_workspace_rename(current_file_name: &str, next_file_name: &str) -> bool {
    current_file_name != next_file_name
        && current_file_name.to_lowercase() == next_file_name.to_lowercase()
}

pub(super) fn get_temporary_rename_file_name(
    workspace_path: &Path,
    metadata: &WorkspaceMetadata,
    tab_id: &str,
    file_name: &str,
) -> String {
    let (base_name, extension) = split_workspace_file_name(file_name);
    let temporary_name = format!("{base_name}-renaming{extension}");
    ensure_unique_file_name(
        workspace_path,
        &WorkspaceMetadata {
            version: metadata.version,
            active_tab_id: metadata.active_tab_id.clone(),
            split_view: metadata.split_view.clone(),
            tabs: metadata
                .tabs
                .iter()
                .filter(|tab| tab.id != tab_id)
                .cloned()
                .collect(),
            archived_tabs: metadata.archived_tabs.clone(),
            execution_history: metadata.execution_history.clone(),
        },
        &temporary_name,
    )
}

pub(super) fn create_empty_cursor_state() -> WorkspaceCursorState {
    WorkspaceCursorState {
        line: 0,
        column: 0,
        scroll_top: 0.0,
    }
}

pub(super) fn write_workspace_file(file_path: &Path, content: &str) -> Result<()> {
    ensure_file_parent_directory(file_path)?;
    fs::write(file_path, content)
        .with_context(|| format!("failed to write {}", file_path.display()))
}

fn read_tab_snapshot(
    workspace_path: &Path,
    tab: &WorkspaceTabState,
) -> Result<Option<WorkspaceTabSnapshot>> {
    let file_path = workspace_path.join(&tab.file_name);
    if !file_path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&file_path)
        .with_context(|| format!("failed to read {}", file_path.display()))?;

    Ok(Some(WorkspaceTabSnapshot {
        id: tab.id.clone(),
        file_name: tab.file_name.clone(),
        cursor: tab.cursor.clone(),
        content,
        is_dirty: false,
    }))
}

pub(super) fn read_workspace_snapshot(workspace_path: &Path) -> Result<WorkspaceSnapshot> {
    ensure_workspace_exists(workspace_path)?;
    let metadata = read_workspace_metadata(workspace_path)?;
    let mut tabs = Vec::with_capacity(metadata.tabs.len());
    let mut existing_tab_states = Vec::with_capacity(metadata.tabs.len());
    let mut existing_archived_tab_states = Vec::with_capacity(metadata.archived_tabs.len());

    for tab in &metadata.tabs {
        let Some(tab_snapshot) = read_tab_snapshot(workspace_path, tab)? else {
            continue;
        };

        tabs.push(tab_snapshot);
        existing_tab_states.push(tab.clone());
    }

    for archived_tab in &metadata.archived_tabs {
        if workspace_path.join(&archived_tab.file_name).exists() {
            existing_archived_tab_states.push(archived_tab.clone());
        }
    }

    let existing_tab_id_set: HashSet<String> =
        existing_tab_states.iter().map(|t| t.id.clone()).collect();
    let normalized_split_view = normalize_split_view(metadata.split_view, &existing_tab_id_set);

    let active_tab_id = match &normalized_split_view {
        Some(split) => {
            let focused_id = match split.focused_pane {
                WorkspacePaneId::Primary => &split.primary_tab_id,
                WorkspacePaneId::Secondary => &split.secondary_tab_id,
            };
            Some(focused_id.clone())
        }
        None => metadata
            .active_tab_id
            .filter(|id| existing_tab_id_set.contains(id.as_str()))
            .or_else(|| existing_tab_states.first().map(|tab| tab.id.clone())),
    };

    let normalized_metadata = WorkspaceMetadata {
        version: WORKSPACE_METADATA_VERSION,
        active_tab_id,
        split_view: normalized_split_view,
        tabs: existing_tab_states,
        archived_tabs: existing_archived_tab_states,
        execution_history: metadata.execution_history,
    };

    write_workspace_metadata(workspace_path, &normalized_metadata)?;

    Ok(WorkspaceSnapshot {
        workspace_path: workspace_path.display().to_string(),
        workspace_name: get_workspace_name(workspace_path),
        metadata: normalized_metadata,
        tabs,
    })
}

pub(super) fn delete_workspace_file_from_disk(file_path: &Path) -> Result<()> {
    match fs::remove_file(file_path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error)
            .with_context(|| format!("failed to delete workspace file {}", file_path.display())),
    }
}

pub(super) fn resolve_workspace_file_delete_path(
    workspace_path: &Path,
    file_name: &str,
) -> Result<PathBuf> {
    let trimmed_file_name = file_name.trim();
    if !trimmed_file_name.is_empty() {
        let exact_path = workspace_path.join(trimmed_file_name);
        if exact_path.exists() {
            return Ok(exact_path);
        }
    }

    let normalized_file_name = normalize_new_workspace_file_name(file_name);
    if !normalized_file_name.is_empty() {
        let normalized_path = workspace_path.join(&normalized_file_name);
        if normalized_path.exists() {
            return Ok(normalized_path);
        }
    }

    if !trimmed_file_name.is_empty() {
        return Ok(workspace_path.join(trimmed_file_name));
    }

    if !normalized_file_name.is_empty() {
        return Ok(workspace_path.join(normalized_file_name));
    }

    Err(anyhow!("Archived workspace tab file name is invalid."))
}

#[cfg(test)]
mod tests;
