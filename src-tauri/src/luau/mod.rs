mod models;
mod parser;

use anyhow::{anyhow, Result};
use fumi_luau_format::{format_luau, FormatOptions};
use tauri::{async_runtime, command};

use crate::command::{format_command_error, run_blocking_command, CommandResponse};

pub(crate) use models::{
    FormatLuauScriptOptions, FormatLuauScriptResult, LuauFileAnalysis, LuauScanMode,
};

/// Scans a Luau file and returns analysis with symbol locations and function scopes.
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

/// Formats valid Luau source and returns formatted text.
#[command]
pub(crate) async fn format_luau_script(
    content: String,
    options: Option<FormatLuauScriptOptions>,
) -> CommandResponse<FormatLuauScriptResult> {
    run_blocking_command(move || format_luau_script_operation(&content, options)).await
}

fn format_luau_script_operation(
    content: &str,
    options: Option<FormatLuauScriptOptions>,
) -> Result<FormatLuauScriptResult> {
    let format_options = options.map_or_else(FormatOptions::default, FormatOptions::from);
    let result = format_luau(content, format_options)?;

    Ok(FormatLuauScriptResult {
        formatted: result.formatted,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn format_luau_script_operation_formats_valid_source() {
        let result =
            format_luau_script_operation("local x=1", None).expect("valid source should format");

        assert_eq!(result.formatted, "local x = 1\n");
    }

    #[test]
    fn format_luau_script_operation_rejects_invalid_source() {
        let error =
            format_luau_script_operation("if then", None).expect_err("invalid source should fail");

        assert!(error.to_string().contains("invalid luau"));
    }
}
