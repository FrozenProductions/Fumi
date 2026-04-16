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
        value.version !== 1 ||
        !Array.isArray(value.scripts) ||
        !(value.activeScriptId === null || isString(value.activeScriptId))
    ) {
        throw createInvalidAutomaticExecutionResponseError(operation);
    }

    return {
        version: 1,
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
