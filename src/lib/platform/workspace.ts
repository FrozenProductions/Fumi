import { invoke } from "@tauri-apps/api/core";
import { Effect } from "effect";
import type {
    WorkspaceBootstrapResponse,
    WorkspaceCursorState,
    WorkspaceSnapshot,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../../lib/workspace/workspace.type";
import { runPromise } from "../shared/effectRuntime";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { WorkspaceCommandError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const DESKTOP_SHELL_REQUIRED_ERROR =
    "Workspace commands require the Tauri desktop shell.";

function createWorkspaceCommandError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): WorkspaceCommandError {
    return new WorkspaceCommandError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}

function invokeWorkspaceCommandEffect<T>(
    command: string,
    operation: string,
    args?: Record<string, unknown>,
): Effect.Effect<T, WorkspaceCommandError> {
    return Effect.tryPromise({
        try: () => invoke<T>(command, args),
        catch: (error) =>
            createWorkspaceCommandError(
                operation,
                error,
                `Could not complete ${operation}.`,
            ),
    });
}

function invokeWorkspaceVoidCommandEffect(
    command: string,
    operation: string,
    args?: Record<string, unknown>,
): Effect.Effect<void, WorkspaceCommandError> {
    return Effect.tryPromise({
        try: () => invoke<void>(command, args),
        catch: (error) =>
            createWorkspaceCommandError(
                operation,
                error,
                `Could not complete ${operation}.`,
            ),
    });
}

export function bootstrapWorkspace(): Promise<WorkspaceBootstrapResponse> {
    return runPromise(bootstrapWorkspaceEffect());
}

export function bootstrapWorkspaceEffect(): Effect.Effect<
    WorkspaceBootstrapResponse,
    WorkspaceCommandError
> {
    if (!isTauriEnvironment()) {
        return Effect.succeed({
            lastWorkspacePath: null,
            workspace: null,
        });
    }

    return invokeWorkspaceCommandEffect<WorkspaceBootstrapResponse>(
        "bootstrap_workspace",
        "bootstrapWorkspace",
    );
}

export function openWorkspace(
    workspacePath: string,
): Promise<WorkspaceSnapshot> {
    return runPromise(openWorkspaceEffect(workspacePath));
}

export function openWorkspaceEffect(
    workspacePath: string,
): Effect.Effect<WorkspaceSnapshot, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new WorkspaceCommandError({
                operation: "openWorkspace",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommandEffect<WorkspaceSnapshot>(
        "open_workspace",
        "openWorkspace",
        {
            workspacePath,
        },
    );
}

export function refreshWorkspace(
    workspacePath: string,
): Promise<WorkspaceSnapshot | null> {
    return runPromise(refreshWorkspaceEffect(workspacePath));
}

export function refreshWorkspaceEffect(
    workspacePath: string,
): Effect.Effect<WorkspaceSnapshot | null, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.succeed(null);
    }

    return invokeWorkspaceCommandEffect<WorkspaceSnapshot | null>(
        "refresh_workspace",
        "refreshWorkspace",
        {
            workspacePath,
        },
    );
}

export function createWorkspaceFile(options: {
    workspacePath: string;
    fileName?: string;
    initialContent?: string;
}): Promise<WorkspaceTabSnapshot> {
    return runPromise(createWorkspaceFileEffect(options));
}

export function createWorkspaceFileEffect(options: {
    workspacePath: string;
    fileName?: string;
    initialContent?: string;
}): Effect.Effect<WorkspaceTabSnapshot, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new WorkspaceCommandError({
                operation: "createWorkspaceFile",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommandEffect<WorkspaceTabSnapshot>(
        "create_workspace_file",
        "createWorkspaceFile",
        options,
    );
}

export function saveWorkspaceFile(options: {
    workspacePath: string;
    tabId: string;
    content: string;
    cursor: WorkspaceCursorState;
}): Promise<void> {
    return runPromise(saveWorkspaceFileEffect(options));
}

export function saveWorkspaceFileEffect(options: {
    workspacePath: string;
    tabId: string;
    content: string;
    cursor: WorkspaceCursorState;
}): Effect.Effect<void, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new WorkspaceCommandError({
                operation: "saveWorkspaceFile",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceVoidCommandEffect(
        "save_workspace_file",
        "saveWorkspaceFile",
        options,
    );
}

export function renameWorkspaceFile(options: {
    workspacePath: string;
    tabId: string;
    fileName: string;
}): Promise<WorkspaceTabState> {
    return runPromise(renameWorkspaceFileEffect(options));
}

export function renameWorkspaceFileEffect(options: {
    workspacePath: string;
    tabId: string;
    fileName: string;
}): Effect.Effect<WorkspaceTabState, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new WorkspaceCommandError({
                operation: "renameWorkspaceFile",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommandEffect<WorkspaceTabState>(
        "rename_workspace_file",
        "renameWorkspaceFile",
        options,
    );
}

export function persistWorkspaceState(options: {
    workspacePath: string;
    activeTabId: string | null;
    tabs: WorkspaceTabState[];
    archivedTabs: WorkspaceTabState[];
}): Promise<void> {
    return runPromise(persistWorkspaceStateEffect(options));
}

export function persistWorkspaceStateEffect(options: {
    workspacePath: string;
    activeTabId: string | null;
    tabs: WorkspaceTabState[];
    archivedTabs: WorkspaceTabState[];
}): Effect.Effect<void, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return invokeWorkspaceVoidCommandEffect(
        "persist_workspace_state",
        "persistWorkspaceState",
        options,
    );
}

export function restoreArchivedWorkspaceTab(options: {
    workspacePath: string;
    tabId: string;
}): Promise<WorkspaceTabSnapshot> {
    return runPromise(restoreArchivedWorkspaceTabEffect(options));
}

export function restoreArchivedWorkspaceTabEffect(options: {
    workspacePath: string;
    tabId: string;
}): Effect.Effect<WorkspaceTabSnapshot, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new WorkspaceCommandError({
                operation: "restoreArchivedWorkspaceTab",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommandEffect<WorkspaceTabSnapshot>(
        "restore_archived_workspace_tab",
        "restoreArchivedWorkspaceTab",
        options,
    );
}

export function restoreAllArchivedWorkspaceTabs(options: {
    workspacePath: string;
}): Promise<void> {
    return runPromise(restoreAllArchivedWorkspaceTabsEffect(options));
}

export function restoreAllArchivedWorkspaceTabsEffect(options: {
    workspacePath: string;
}): Effect.Effect<void, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new WorkspaceCommandError({
                operation: "restoreAllArchivedWorkspaceTabs",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceVoidCommandEffect(
        "restore_all_archived_workspace_tabs",
        "restoreAllArchivedWorkspaceTabs",
        options,
    );
}

export function deleteArchivedWorkspaceTab(options: {
    workspacePath: string;
    tabId: string;
    fileName: string;
}): Promise<void> {
    return runPromise(deleteArchivedWorkspaceTabEffect(options));
}

export function deleteArchivedWorkspaceTabEffect(options: {
    workspacePath: string;
    tabId: string;
    fileName: string;
}): Effect.Effect<void, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new WorkspaceCommandError({
                operation: "deleteArchivedWorkspaceTab",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceVoidCommandEffect(
        "delete_archived_workspace_tab",
        "deleteArchivedWorkspaceTab",
        options,
    );
}

export function deleteAllArchivedWorkspaceTabs(options: {
    workspacePath: string;
}): Promise<void> {
    return runPromise(deleteAllArchivedWorkspaceTabsEffect(options));
}

export function deleteAllArchivedWorkspaceTabsEffect(options: {
    workspacePath: string;
}): Effect.Effect<void, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new WorkspaceCommandError({
                operation: "deleteAllArchivedWorkspaceTabs",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceVoidCommandEffect(
        "delete_all_archived_workspace_tabs",
        "deleteAllArchivedWorkspaceTabs",
        options,
    );
}

export function setWorkspaceUnsavedChanges(
    hasUnsavedChanges: boolean,
): Promise<void> {
    return runPromise(setWorkspaceUnsavedChangesEffect(hasUnsavedChanges));
}

export function setWorkspaceUnsavedChangesEffect(
    hasUnsavedChanges: boolean,
): Effect.Effect<void, WorkspaceCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return invokeWorkspaceVoidCommandEffect(
        "set_workspace_unsaved_changes",
        "setWorkspaceUnsavedChanges",
        {
            hasUnsavedChanges,
        },
    );
}
