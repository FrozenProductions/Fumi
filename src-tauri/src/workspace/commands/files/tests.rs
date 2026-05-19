
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
    let draft =
        build_dropped_workspace_script_draft(file.path()).expect("luau file should be imported");

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
