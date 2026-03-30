use super::*;
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
    }));

    assert_eq!(metadata.version, 2);
    assert_eq!(metadata.active_tab_id.as_deref(), Some("open-1"));
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
fn ensure_unique_file_name_accounts_for_metadata_and_existing_files() {
    let workspace_dir = TestWorkspaceDir::new("unique-name");
    fs::write(workspace_dir.path().join("alpha-2.lua"), "-- existing file")
        .expect("existing workspace file should be created");

    let metadata = WorkspaceMetadata {
        version: 2,
        active_tab_id: Some("open-1".to_string()),
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
            version: 2,
            active_tab_id: Some("missing-open".to_string()),
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
    assert_eq!(snapshot.metadata.tabs.len(), 1);
    assert_eq!(snapshot.metadata.archived_tabs.len(), 1);
    assert_eq!(snapshot.metadata.archived_tabs[0].file_name, "archived.lua");

    let persisted_metadata =
        read_json_file::<WorkspaceMetadata>(&get_workspace_metadata_path(workspace_dir.path()))?
            .expect("normalized metadata should be persisted");
    assert_eq!(persisted_metadata.active_tab_id.as_deref(), Some("open-1"));
    assert_eq!(persisted_metadata.tabs.len(), 1);
    assert_eq!(persisted_metadata.tabs[0].file_name, "open.lua");
    assert_eq!(persisted_metadata.archived_tabs.len(), 1);
    assert_eq!(
        persisted_metadata.archived_tabs[0].file_name,
        "archived.lua"
    );

    Ok(())
}
