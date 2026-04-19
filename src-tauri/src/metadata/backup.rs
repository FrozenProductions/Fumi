use std::{
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
};

use anyhow::{Context, Result};

pub(crate) fn create_backup(source_path: &Path, backup_path: &Path) -> Result<bool> {
    let bytes = match fs::read(source_path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(false),
        Err(error) => {
            return Err(error).with_context(|| format!("failed to read {}", source_path.display()));
        }
    };

    if let Some(parent) = backup_path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("failed to create directory {}", parent.display()))?;
    }

    fs::write(backup_path, bytes)
        .with_context(|| format!("failed to write backup {}", backup_path.display()))?;

    Ok(true)
}

pub(crate) fn versioned_backup_file_name(version: u8, timestamp: i64) -> String {
    format!("{timestamp}-v{version}.json")
}

pub(crate) fn join_backup_path(root: &Path, folder: &str, version: u8, timestamp: i64) -> PathBuf {
    root.join(folder)
        .join(versioned_backup_file_name(version, timestamp))
}
