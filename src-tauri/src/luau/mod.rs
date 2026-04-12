mod models;
mod parser;

use anyhow::anyhow;
use tauri::{async_runtime, command};

use crate::command::{format_command_error, CommandResponse};

pub(crate) use models::{LuauFileAnalysis, LuauScanMode};

#[command]
pub(crate) async fn scan_luau_file_analysis(
    content: String,
    mode: Option<LuauScanMode>,
) -> CommandResponse<LuauFileAnalysis> {
    let scan_mode = mode.unwrap_or_default();

    async_runtime::spawn_blocking(move || parser::scan_luau_file_analysis(&content, scan_mode))
        .await
        .map_err(|error| format_command_error(anyhow!("failed to join luau scan task: {error}")))
}
