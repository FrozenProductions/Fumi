use anyhow::Result;

pub(crate) type CommandResponse<T> = std::result::Result<T, String>;

pub(crate) fn format_command_error(error: anyhow::Error) -> String {
    format!("{error:#}")
}

pub(crate) fn run_command<T>(operation: impl FnOnce() -> Result<T>) -> CommandResponse<T> {
    operation().map_err(format_command_error)
}
