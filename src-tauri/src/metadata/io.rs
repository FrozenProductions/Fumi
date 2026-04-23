//! Atomic file I/O for JSON and binary metadata persistence.

use std::{
    fs::{self, File, OpenOptions},
    io::{ErrorKind, Write},
    path::Path,
    process,
    sync::atomic::{AtomicU64, Ordering},
};

use anyhow::{Context, Result};
use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;

use super::current_unix_timestamp;

static TEMP_FILE_COUNTER: AtomicU64 = AtomicU64::new(0);

pub(crate) fn ensure_directory(path: &Path) -> Result<()> {
    fs::create_dir_all(path)
        .with_context(|| format!("failed to create directory {}", path.display()))
}

pub(crate) fn ensure_file_parent_directory(path: &Path) -> Result<()> {
    match path.parent() {
        Some(parent) => ensure_directory(parent),
        None => Ok(()),
    }
}

pub(crate) fn read_json_file<T: DeserializeOwned>(file_path: &Path) -> Result<Option<T>> {
    match fs::read_to_string(file_path) {
        Ok(text) => serde_json::from_str(&text)
            .with_context(|| format!("failed to parse json from {}", file_path.display()))
            .map(Some),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error).with_context(|| format!("failed to read {}", file_path.display())),
    }
}

pub(crate) fn read_json_value(file_path: &Path) -> Result<Option<Value>> {
    read_json_file(file_path)
}

pub(crate) fn atomic_write_json<T: Serialize>(file_path: &Path, value: &T) -> Result<()> {
    let text = format!(
        "{}\n",
        serde_json::to_string_pretty(value).context("failed to serialize json payload")?
    );

    atomic_write_bytes(file_path, text.as_bytes())
}

pub(crate) fn atomic_write_bytes(file_path: &Path, bytes: &[u8]) -> Result<()> {
    ensure_file_parent_directory(file_path)?;
    let timestamp = current_unix_timestamp()?;
    let counter = TEMP_FILE_COUNTER.fetch_add(1, Ordering::Relaxed);
    let temp_path =
        file_path.with_extension(format!("tmp-{}-{timestamp}-{counter}", process::id()));

    let write_result = (|| -> Result<()> {
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temp_path)
            .with_context(|| format!("failed to create {}", temp_path.display()))?;
        file.write_all(bytes)
            .with_context(|| format!("failed to write {}", temp_path.display()))?;
        file.sync_all()
            .with_context(|| format!("failed to sync {}", temp_path.display()))?;
        fs::rename(&temp_path, file_path).with_context(|| {
            format!(
                "failed to move {} to {}",
                temp_path.display(),
                file_path.display()
            )
        })?;

        if let Some(parent) = file_path.parent() {
            File::open(parent)
                .with_context(|| format!("failed to open {}", parent.display()))?
                .sync_all()
                .with_context(|| format!("failed to sync {}", parent.display()))?;
        }

        Ok(())
    })();

    if write_result.is_err() {
        let _ = fs::remove_file(&temp_path);
    }

    write_result
}
