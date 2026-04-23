import type { OperationErrorOptions } from "../shared/operationError";
import { OperationError } from "../shared/operationError";

/**
 * Error thrown when a general platform operation fails (e.g. opening URLs or directories).
 */
export class PlatformOperationError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("PlatformOperationError", options);
    }
}

/**
 * Error thrown when a window shell operation fails (e.g. dragging, resizing, or exit guards).
 */
export class WindowShellError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("WindowShellError", options);
    }
}

/**
 * Error thrown when a workspace Tauri command fails (e.g. opening, saving, or file operations).
 */
export class WorkspaceCommandError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("WorkspaceCommandError", options);
    }
}

/**
 * Error thrown when an executor Tauri command fails (e.g. attaching, detaching, or executing scripts).
 */
export class ExecutorCommandError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("ExecutorCommandError", options);
    }
}

/**
 * Error thrown when an automatic execution Tauri command fails (e.g. bootstrapping or saving scripts).
 */
export class AutomaticExecutionCommandError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("AutomaticExecutionCommandError", options);
    }
}

/**
 * Error thrown when an accounts Tauri command fails (e.g. listing or launching accounts).
 */
export class AccountsCommandError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("AccountsCommandError", options);
    }
}

/**
 * Error thrown when an app update operation fails (e.g. checking, downloading, or installing updates).
 */
export class UpdaterError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("UpdaterError", options);
    }
}
