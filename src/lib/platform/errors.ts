import { Schema } from "effect";

export class PlatformOperationError extends Schema.TaggedError<PlatformOperationError>()(
    "PlatformOperationError",
    {
        operation: Schema.String,
        message: Schema.String,
    },
) {}

export class WindowShellError extends Schema.TaggedError<WindowShellError>()(
    "WindowShellError",
    {
        operation: Schema.String,
        message: Schema.String,
    },
) {}

export class WorkspaceCommandError extends Schema.TaggedError<WorkspaceCommandError>()(
    "WorkspaceCommandError",
    {
        operation: Schema.String,
        message: Schema.String,
    },
) {}

export class ExecutorCommandError extends Schema.TaggedError<ExecutorCommandError>()(
    "ExecutorCommandError",
    {
        operation: Schema.String,
        message: Schema.String,
    },
) {}

export class AccountsCommandError extends Schema.TaggedError<AccountsCommandError>()(
    "AccountsCommandError",
    {
        operation: Schema.String,
        message: Schema.String,
    },
) {}

export class UpdaterError extends Schema.TaggedError<UpdaterError>()(
    "UpdaterError",
    {
        operation: Schema.String,
        message: Schema.String,
    },
) {}
