use super::*;
use crate::executor::ExecutorKind;
use std::time::{SystemTime, UNIX_EPOCH};

struct TestWorkspaceDir {
    path: PathBuf,
}

impl TestWorkspaceDir {
    fn new(name: &str) -> Self {
        let unique_suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after unix epoch")
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "fumi-storage-tests-{name}-{}-{unique_suffix}",
            std::process::id()
        ));
        fs::create_dir_all(&path).expect("test workspace directory should be created");

        Self { path }
    }

    fn path(&self) -> &Path {
        &self.path
    }
}

impl Drop for TestWorkspaceDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

fn cursor(line: i64, column: i64, scroll_top: f64) -> WorkspaceCursorState {
    WorkspaceCursorState {
        line,
        column,
        scroll_top,
    }
}

fn tab(
    id: &str,
    file_name: &str,
    cursor: WorkspaceCursorState,
    archived_at: Option<i64>,
) -> WorkspaceTabState {
    WorkspaceTabState {
        id: id.to_string(),
        file_name: file_name.to_string(),
        cursor,
        archived_at,
    }
}

fn history_entry(id: &str, executed_at: i64) -> WorkspaceExecutionHistoryEntry {
    WorkspaceExecutionHistoryEntry {
        id: id.to_string(),
        executed_at,
        executor_kind: ExecutorKind::Macsploit,
        port: 5553,
        account_id: Some("account-1".to_string()),
        account_display_name: Some("Main".to_string()),
        is_bound_to_unknown_account: false,
        file_name: "script.lua".to_string(),
        script_content: format!("print('{id}')"),
    }
}

#[test]
fn normalize_new_workspace_file_name_sanitizes_and_rejects_overlong_names() {
    assert_eq!(
        normalize_new_workspace_file_name(r"  scripts\\..\\ .bad:*name?  "),
        "bad--name-.lua"
    );
    assert_eq!(normalize_new_workspace_file_name("   "), "");

    let overlong_name = "a".repeat(MAX_WORKSPACE_TAB_NAME_LENGTH + 1);
    assert_eq!(normalize_new_workspace_file_name(&overlong_name), "");
}

#[test]
fn normalize_workspace_metadata_repairs_invalid_entries_and_conflicts() {
    let metadata = normalize_workspace_metadata(Some(StoredWorkspaceMetadata {
        version: 2,
        active_tab_id: Some("missing-tab".to_string()),
        split_view: None,
        tabs: Some(vec![
            tab(
                "  open-1  ",
                " folders/alpha ",
                cursor(-3, -7, f64::NEG_INFINITY),
                None,
            ),
            tab("", "alpha.lua", cursor(1, 2, 3.0), None),
            tab("open-3", "   ", cursor(4, 5, 6.0), None),
        ]),
        archived_tabs: Some(vec![
            tab("arch-1", ".beta", cursor(9, 10, 11.0), Some(50)),
            tab("arch-2", "alpha.lua", cursor(1, 1, 1.0), Some(75)),
        ]),
        execution_history: Some(vec![history_entry("legacy-history", 99)]),
    }));

    assert_eq!(metadata.version, WORKSPACE_METADATA_VERSION);
    assert!(metadata.split_view.is_none());
    assert_eq!(metadata.active_tab_id.as_deref(), Some("open-1"));
    assert!(metadata.execution_history.is_empty());
    assert_eq!(metadata.tabs.len(), 1);
    assert_eq!(metadata.tabs[0].id, "open-1");
    assert_eq!(metadata.tabs[0].file_name, "alpha.lua");
    assert_eq!(metadata.tabs[0].cursor.line, 0);
    assert_eq!(metadata.tabs[0].cursor.column, 0);
    assert_eq!(metadata.tabs[0].cursor.scroll_top, 0.0);

    assert_eq!(metadata.archived_tabs.len(), 1);
    assert_eq!(metadata.archived_tabs[0].id, "arch-1");
    assert_eq!(metadata.archived_tabs[0].file_name, "beta.lua");
    assert_eq!(metadata.archived_tabs[0].archived_at, Some(50));
}

#[test]
fn normalize_workspace_metadata_preserves_secondary_tab_ids_for_split_view() {
    let metadata = normalize_workspace_metadata(Some(StoredWorkspaceMetadata {
        version: WORKSPACE_METADATA_VERSION,
        active_tab_id: Some("tab-3".to_string()),
        split_view: Some(WorkspaceSplitView {
            direction: "vertical".to_string(),
            primary_tab_id: "tab-3".to_string(),
            secondary_tab_id: "tab-1".to_string(),
            secondary_tab_ids: vec![
                "tab-1".to_string(),
                "tab-2".to_string(),
                "missing-tab".to_string(),
            ],
            split_ratio: 0.68,
            focused_pane: WorkspacePaneId::Primary,
        }),
        tabs: Some(vec![
            tab("tab-1", "one.lua", create_empty_cursor_state(), None),
            tab("tab-2", "two.lua", create_empty_cursor_state(), None),
            tab("tab-3", "three.lua", create_empty_cursor_state(), None),
        ]),
        archived_tabs: Some(vec![]),
        execution_history: Some(vec![
            history_entry("history-1", 10),
            history_entry("history-2", 9),
        ]),
    }));

    assert_eq!(
        metadata
            .split_view
            .as_ref()
            .map(|split| split.primary_tab_id.as_str()),
        Some("tab-3")
    );
    assert_eq!(
        metadata
            .split_view
            .as_ref()
            .map(|split| split.secondary_tab_id.as_str()),
        Some("tab-1")
    );
    assert_eq!(
        metadata
            .split_view
            .as_ref()
            .map(|split| split.secondary_tab_ids.clone()),
        Some(vec!["tab-1".to_string(), "tab-2".to_string()])
    );
    assert_eq!(
        metadata.split_view.as_ref().map(|split| split.split_ratio),
        Some(0.68)
    );
    assert_eq!(
        metadata.execution_history,
        vec![history_entry("history-1", 10), history_entry("history-2", 9)]
    );
}

#[test]
fn normalize_workspace_metadata_upgrades_legacy_versions_to_v4_with_empty_history() {
    for version in 1..=3 {
        let metadata = normalize_workspace_metadata(Some(StoredWorkspaceMetadata {
            version,
            active_tab_id: Some("tab-1".to_string()),
            split_view: None,
            tabs: Some(vec![tab(
                "tab-1",
                "one.lua",
                create_empty_cursor_state(),
                None,
            )]),
            archived_tabs: Some(vec![]),
            execution_history: Some(vec![history_entry("legacy", 1)]),
        }));

        assert_eq!(metadata.version, WORKSPACE_METADATA_VERSION);
        assert!(metadata.execution_history.is_empty());
    }
}

#[test]
fn ensure_unique_file_name_accounts_for_metadata_and_existing_files() {
    let workspace_dir = TestWorkspaceDir::new("unique-name");
    fs::write(workspace_dir.path().join("alpha-2.lua"), "-- existing file")
        .expect("existing workspace file should be created");

    let metadata = WorkspaceMetadata {
        version: WORKSPACE_METADATA_VERSION,
        active_tab_id: Some("open-1".to_string()),
        split_view: None,
        tabs: vec![tab(
            "open-1",
            "alpha.lua",
            create_empty_cursor_state(),
            None,
        )],
        archived_tabs: vec![tab(
            "arch-1",
            "alpha-1.lua",
            create_empty_cursor_state(),
            Some(10),
        )],
        execution_history: vec![],
    };

    assert_eq!(
        ensure_unique_file_name(workspace_dir.path(), &metadata, "alpha"),
        "alpha-3.lua"
    );
    assert_eq!(
        ensure_unique_file_name(workspace_dir.path(), &metadata, "   "),
        "script-1.lua"
    );
}

#[test]
fn read_workspace_snapshot_prunes_missing_files_and_persists_cleaned_metadata() -> anyhow::Result<()>
{
    let workspace_dir = TestWorkspaceDir::new("snapshot");

    write_workspace_file(&workspace_dir.path().join("open.lua"), "print('open')")?;
    write_workspace_file(
        &workspace_dir.path().join("archived.lua"),
        "print('archived')",
    )?;
    write_json_file(
        &get_workspace_metadata_path(workspace_dir.path()),
        &WorkspaceMetadata {
            version: WORKSPACE_METADATA_VERSION,
            active_tab_id: Some("missing-open".to_string()),
            split_view: None,
            tabs: vec![
                tab(
                    "missing-open",
                    "missing.lua",
                    create_empty_cursor_state(),
                    None,
                ),
                tab("open-1", "open.lua", create_empty_cursor_state(), None),
            ],
            archived_tabs: vec![
                tab(
                    "arch-1",
                    "archived.lua",
                    create_empty_cursor_state(),
                    Some(123),
                ),
                tab(
                    "arch-2",
                    "ghost.lua",
                    create_empty_cursor_state(),
                    Some(456),
                ),
            ],
            execution_history: vec![history_entry("history-1", 123)],
        },
    )?;

    let snapshot = read_workspace_snapshot(workspace_dir.path())?;
    let expected_workspace_name = workspace_dir
        .path()
        .file_name()
        .and_then(|value| value.to_str())
        .expect("test workspace directory should have a final path segment");

    assert_eq!(snapshot.workspace_name, expected_workspace_name);
    assert_eq!(snapshot.tabs.len(), 1);
    assert_eq!(snapshot.tabs[0].id, "open-1");
    assert_eq!(snapshot.tabs[0].file_name, "open.lua");
    assert_eq!(snapshot.tabs[0].content, "print('open')");
    assert!(!snapshot.tabs[0].is_dirty);
    assert_eq!(snapshot.metadata.active_tab_id.as_deref(), Some("open-1"));
    assert!(snapshot.metadata.split_view.is_none());
    assert_eq!(snapshot.metadata.tabs.len(), 1);
    assert_eq!(snapshot.metadata.archived_tabs.len(), 1);
    assert_eq!(snapshot.metadata.archived_tabs[0].file_name, "archived.lua");
    assert_eq!(
        snapshot.metadata.execution_history,
        vec![history_entry("history-1", 123)]
    );

    let persisted_metadata =
        read_json_file::<WorkspaceMetadata>(&get_workspace_metadata_path(workspace_dir.path()))?
            .expect("normalized metadata should be persisted");
    assert_eq!(persisted_metadata.active_tab_id.as_deref(), Some("open-1"));
    assert!(persisted_metadata.split_view.is_none());
    assert_eq!(persisted_metadata.tabs.len(), 1);
    assert_eq!(persisted_metadata.tabs[0].file_name, "open.lua");
    assert_eq!(persisted_metadata.archived_tabs.len(), 1);
    assert_eq!(
        persisted_metadata.archived_tabs[0].file_name,
        "archived.lua"
    );
    assert_eq!(
        persisted_metadata.execution_history,
        vec![history_entry("history-1", 123)]
    );

    Ok(())
}

#[test]
fn read_workspace_snapshot_preserves_split_membership() -> anyhow::Result<()> {
    let workspace_dir = TestWorkspaceDir::new("split-membership");

    write_workspace_file(&workspace_dir.path().join("one.lua"), "print('one')")?;
    write_workspace_file(&workspace_dir.path().join("two.lua"), "print('two')")?;
    write_workspace_file(&workspace_dir.path().join("three.lua"), "print('three')")?;

    write_json_file(
        &get_workspace_metadata_path(workspace_dir.path()),
        &WorkspaceMetadata {
            version: WORKSPACE_METADATA_VERSION,
            active_tab_id: Some("tab-3".to_string()),
            split_view: Some(WorkspaceSplitView {
                direction: "vertical".to_string(),
                primary_tab_id: "tab-3".to_string(),
                secondary_tab_id: "tab-1".to_string(),
                secondary_tab_ids: vec!["tab-1".to_string(), "tab-2".to_string()],
                split_ratio: 0.64,
                focused_pane: WorkspacePaneId::Primary,
            }),
            tabs: vec![
                tab("tab-1", "one.lua", create_empty_cursor_state(), None),
                tab("tab-2", "two.lua", create_empty_cursor_state(), None),
                tab("tab-3", "three.lua", create_empty_cursor_state(), None),
            ],
            archived_tabs: vec![],
            execution_history: vec![history_entry("history-1", 50)],
        },
    )?;

    let snapshot = read_workspace_snapshot(workspace_dir.path())?;
    let split_view = snapshot
        .metadata
        .split_view
        .expect("split view should survive snapshot normalization");

    assert_eq!(split_view.primary_tab_id, "tab-3");
    assert_eq!(split_view.secondary_tab_id, "tab-1");
    assert_eq!(
        split_view.secondary_tab_ids,
        vec!["tab-1".to_string(), "tab-2".to_string()]
    );
    assert_eq!(split_view.split_ratio, 0.64);
    assert_eq!(
        snapshot.metadata.execution_history,
        vec![history_entry("history-1", 50)]
    );

    Ok(())
}

#[test]
fn append_workspace_execution_history_preserves_metadata_and_caps_to_100_entries(
) -> anyhow::Result<()> {
    let workspace_dir = TestWorkspaceDir::new("append-history");

    write_workspace_file(&workspace_dir.path().join("one.lua"), "print('one')")?;
    write_json_file(
        &get_workspace_metadata_path(workspace_dir.path()),
        &WorkspaceMetadata {
            version: WORKSPACE_METADATA_VERSION,
            active_tab_id: Some("tab-1".to_string()),
            split_view: Some(WorkspaceSplitView {
                direction: "vertical".to_string(),
                primary_tab_id: "tab-1".to_string(),
                secondary_tab_id: "tab-2".to_string(),
                secondary_tab_ids: vec!["tab-2".to_string()],
                split_ratio: 0.5,
                focused_pane: WorkspacePaneId::Primary,
            }),
            tabs: vec![
                tab("tab-1", "one.lua", create_empty_cursor_state(), None),
                tab("tab-2", "two.lua", create_empty_cursor_state(), None),
            ],
            archived_tabs: vec![tab(
                "arch-1",
                "archived.lua",
                create_empty_cursor_state(),
                Some(1),
            )],
            execution_history: (0..MAX_WORKSPACE_EXECUTION_HISTORY_ENTRIES)
                .map(|index| history_entry(&format!("history-{index}"), index as i64))
                .collect(),
        },
    )?;

    let updated_history = append_workspace_execution_history(
        workspace_dir.path(),
        history_entry("latest", 9_999),
    )?;
    let persisted_metadata =
        read_workspace_metadata(workspace_dir.path())?;

    assert_eq!(updated_history.len(), MAX_WORKSPACE_EXECUTION_HISTORY_ENTRIES);
    assert_eq!(updated_history[0].id, "latest");
    assert_eq!(persisted_metadata.execution_history, updated_history);
    assert_eq!(persisted_metadata.tabs.len(), 2);
    assert_eq!(persisted_metadata.archived_tabs.len(), 1);
    assert!(persisted_metadata.split_view.is_some());

    Ok(())
}
