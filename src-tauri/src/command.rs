use anyhow::{anyhow, Result};
use tauri::async_runtime;

pub(crate) type CommandResponse<T> = std::result::Result<T, String>;

pub(crate) fn format_command_error(error: anyhow::Error) -> String {
    format!("{error:#}")
}

pub(crate) fn run_command<T>(operation: impl FnOnce() -> Result<T>) -> CommandResponse<T> {
    operation().map_err(format_command_error)
}

pub(crate) async fn run_blocking_command<T>(
    operation: impl FnOnce() -> Result<T> + Send + 'static,
) -> CommandResponse<T>
where
    T: Send + 'static,
{
    async_runtime::spawn_blocking(operation)
        .await
        .map_err(|error| {
            format_command_error(anyhow!("failed to join blocking command task: {error}"))
        })?
        .map_err(format_command_error)
}
