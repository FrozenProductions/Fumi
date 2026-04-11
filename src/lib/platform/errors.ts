import {
    OperationError,
    type OperationErrorOptions,
} from "../shared/operationError";

export class PlatformOperationError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("PlatformOperationError", options);
    }
}

export class WindowShellError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("WindowShellError", options);
    }
}

export class WorkspaceCommandError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("WorkspaceCommandError", options);
    }
}

export class ExecutorCommandError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("ExecutorCommandError", options);
    }
}

export class AccountsCommandError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("AccountsCommandError", options);
    }
}

export class UpdaterError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("UpdaterError", options);
    }
}
