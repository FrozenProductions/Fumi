import { invoke } from "@tauri-apps/api/core";
import type {
    AutomaticExecutionCursorState,
    AutomaticExecutionMetadata,
    AutomaticExecutionScriptSnapshot,
    AutomaticExecutionScriptState,
    AutomaticExecutionSnapshot,
} from "../automaticExecution/automaticExecution.type";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { isBoolean, isNumber, isRecord, isString } from "../shared/validation";
import type { ExecutorKind } from "../workspace/workspace.type";
import { AutomaticExecutionCommandError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const DESKTOP_SHELL_REQUIRED_ERROR =
    "Automatic execution commands require the Tauri desktop shell.";

function createAutomaticExecutionCommandError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): AutomaticExecutionCommandError {
    return new AutomaticExecutionCommandError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}

function createInvalidAutomaticExecutionResponseError(
    operation: string,
): AutomaticExecutionCommandError {
    return new AutomaticExecutionCommandError({
        operation,
        message: `Unexpected response shape for ${operation}.`,
    });
}

function isExecutorKind(value: unknown): value is ExecutorKind {
    return (
        value === "macsploit" ||
        value === "opiumware" ||
        value === "unsupported"
    );
}

function parseCursorState(
    value: unknown,
    operation: string,
): AutomaticExecutionCursorState {
    if (
        !isRecord(value) ||
        !isNumber(value.line) ||
        !isNumber(value.column) ||
        !isNumber(value.scrollTop)
    ) {
        throw createInvalidAutomaticExecutionResponseError(operation);
    }

    return {
        line: value.line,
        column: value.column,
        scrollTop: value.scrollTop,
    };
}

function parseScriptState(
    value: unknown,
    operation: string,
): AutomaticExecutionScriptState {
    if (!isRecord(value) || !isString(value.id) || !isString(value.fileName)) {
        throw createInvalidAutomaticExecutionResponseError(operation);
    }

    return {
        id: value.id,
        fileName: value.fileName,
        cursor: parseCursorState(value.cursor, operation),
    };
}

function parseScriptSnapshot(
    value: unknown,
    operation: string,
): AutomaticExecutionScriptSnapshot {
    if (
        !isRecord(value) ||
        !isString(value.content) ||
        !isBoolean(value.isDirty)
    ) {
        throw createInvalidAutomaticExecutionResponseError(operation);
    }

    const script = parseScriptState(value, operation);

    return {
        ...script,
        content: value.content,
        isDirty: value.isDirty,
    };
}

function parseMetadata(
    value: unknown,
    operation: string,
): AutomaticExecutionMetadata {
    if (
        !isRecord(value) ||
        value.version !== 2 ||
        !Array.isArray(value.scripts) ||
        !(value.activeScriptId === null || isString(value.activeScriptId))
    ) {
        throw createInvalidAutomaticExecutionResponseError(operation);
    }

    return {
        version: 2,
        activeScriptId: value.activeScriptId,
        scripts: value.scripts.map((script) =>
            parseScriptState(script, operation),
        ),
    };
}

function parseSnapshot(
    value: unknown,
    operation: string,
): AutomaticExecutionSnapshot {
    if (
        !isRecord(value) ||
        !isExecutorKind(value.executorKind) ||
        !isString(value.resolvedPath) ||
        !Array.isArray(value.scripts)
    ) {
        throw createInvalidAutomaticExecutionResponseError(operation);
    }

    return {
        executorKind: value.executorKind,
        resolvedPath: value.resolvedPath,
        metadata: parseMetadata(value.metadata, operation),
        scripts: value.scripts.map((script) =>
            parseScriptSnapshot(script, operation),
        ),
    };
}

async function invokeAutomaticExecutionCommand<T>(
    command: string,
    operation: string,
    parseValue: (value: unknown, parseOperation: string) => T,
    args?: Record<string, unknown>,
): Promise<T> {
    try {
        const value = await invoke<unknown>(command, args);
        return parseValue(value, operation);
    } catch (error) {
        if (error instanceof AutomaticExecutionCommandError) {
            throw error;
        }

        throw createAutomaticExecutionCommandError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

async function invokeAutomaticExecutionVoidCommand(
    command: string,
    operation: string,
    args?: Record<string, unknown>,
): Promise<void> {
    try {
        await invoke<void>(command, args);
    } catch (error) {
        throw createAutomaticExecutionCommandError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

/**
 * Bootstraps the automatic execution state for the specified executor kind.
 *
 * @param executorKind - The type of executor to bootstrap
 * @returns Complete snapshot including all scripts and metadata
 */
export function bootstrapAutomaticExecution(
    executorKind: ExecutorKind,
): Promise<AutomaticExecutionSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AutomaticExecutionCommandError({
                operation: "bootstrapAutomaticExecution",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAutomaticExecutionCommand(
        "bootstrap_automatic_execution",
        "bootstrapAutomaticExecution",
        parseSnapshot,
        {
            executorKind,
        },
    );
}

/**
 * Refreshes the automatic execution state from disk.
 *
 * @param executorKind - The type of executor to refresh
 * @returns Updated snapshot with current script states
 */
export function refreshAutomaticExecution(
    executorKind: ExecutorKind,
): Promise<AutomaticExecutionSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AutomaticExecutionCommandError({
                operation: "refreshAutomaticExecution",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAutomaticExecutionCommand(
        "refresh_automatic_execution",
        "refreshAutomaticExecution",
        parseSnapshot,
        {
            executorKind,
        },
    );
}

/**
 * Creates a new script in the automatic execution collection.
 *
 * @param options - Script creation options
 * @param options.executorKind - The executor kind for the script
 * @param options.fileName - Optional initial file name
 * @param options.initialContent - Optional initial content
 * @returns The created script snapshot
 */
export function createAutomaticExecutionScript(options: {
    executorKind: ExecutorKind;
    fileName?: string;
    initialContent?: string;
}): Promise<AutomaticExecutionScriptSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AutomaticExecutionCommandError({
                operation: "createAutomaticExecutionScript",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAutomaticExecutionCommand(
        "create_automatic_execution_script",
        "createAutomaticExecutionScript",
        parseScriptSnapshot,
        options,
    );
}

/**
 * Saves the content and cursor state of an automatic execution script.
 *
 * @param options - Save options
 * @param options.executorKind - The executor kind
 * @param options.scriptId - ID of the script to save
 * @param options.content - The script content to persist
 * @param options.cursor - Current cursor position
 */
export function saveAutomaticExecutionScript(options: {
    executorKind: ExecutorKind;
    scriptId: string;
    content: string;
    cursor: AutomaticExecutionCursorState;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AutomaticExecutionCommandError({
                operation: "saveAutomaticExecutionScript",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAutomaticExecutionVoidCommand(
        "save_automatic_execution_script",
        "saveAutomaticExecutionScript",
        options,
    );
}

/**
 * Renames a script in the automatic execution collection.
 *
 * @param options - Rename options
 * @param options.executorKind - The executor kind
 * @param options.scriptId - ID of the script to rename
 * @param options.fileName - New file name
 * @returns The updated script state
 */
export function renameAutomaticExecutionScript(options: {
    executorKind: ExecutorKind;
    scriptId: string;
    fileName: string;
}): Promise<AutomaticExecutionScriptState> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AutomaticExecutionCommandError({
                operation: "renameAutomaticExecutionScript",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAutomaticExecutionCommand(
        "rename_automatic_execution_script",
        "renameAutomaticExecutionScript",
        parseScriptState,
        options,
    );
}

/**
 * Deletes a script from the automatic execution collection.
 *
 * @param options - Delete options
 * @param options.executorKind - The executor kind
 * @param options.scriptId - ID of the script to delete
 */
export function deleteAutomaticExecutionScript(options: {
    executorKind: ExecutorKind;
    scriptId: string;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AutomaticExecutionCommandError({
                operation: "deleteAutomaticExecutionScript",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAutomaticExecutionVoidCommand(
        "delete_automatic_execution_script",
        "deleteAutomaticExecutionScript",
        options,
    );
}

/**
 * Persists the automatic execution state including active script and ordering.
 *
 * @param options - State to persist
 * @param options.executorKind - The executor kind
 * @param options.activeScriptId - Currently active script ID
 * @param options.scripts - Ordered array of script states
 */
export function persistAutomaticExecutionState(options: {
    executorKind: ExecutorKind;
    activeScriptId: string | null;
    scripts: AutomaticExecutionScriptState[];
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve();
    }

    return invokeAutomaticExecutionVoidCommand(
        "persist_automatic_execution_state",
        "persistAutomaticExecutionState",
        options,
    );
}

/**
 * Notifies the backend of unsaved changes state.
 *
 * @param hasUnsavedChanges - Whether there are unsaved changes
 */
export function setAutomaticExecutionUnsavedChanges(
    hasUnsavedChanges: boolean,
): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve();
    }

    return invokeAutomaticExecutionVoidCommand(
        "set_automatic_execution_unsaved_changes",
        "setAutomaticExecutionUnsavedChanges",
        {
            hasUnsavedChanges,
        },
    );
}
