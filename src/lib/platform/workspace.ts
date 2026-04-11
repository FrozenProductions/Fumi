import { invoke } from "@tauri-apps/api/core";
import type {
    WorkspaceBootstrapResponse,
    WorkspaceCursorState,
    WorkspaceSnapshot,
    WorkspaceSplitView,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../../lib/workspace/workspace.type";
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

async function invokeWorkspaceCommand<T>(
    command: string,
    operation: string,
    args?: Record<string, unknown>,
): Promise<T> {
    try {
        return await invoke<T>(command, args);
    } catch (error) {
        throw createWorkspaceCommandError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

async function invokeWorkspaceVoidCommand(
    command: string,
    operation: string,
    args?: Record<string, unknown>,
): Promise<void> {
    try {
        await invoke<void>(command, args);
    } catch (error) {
        throw createWorkspaceCommandError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

export function bootstrapWorkspace(): Promise<WorkspaceBootstrapResponse> {
    if (!isTauriEnvironment()) {
        return Promise.resolve({
            lastWorkspacePath: null,
            workspace: null,
        });
    }

    return invokeWorkspaceCommand<WorkspaceBootstrapResponse>(
        "bootstrap_workspace",
        "bootstrapWorkspace",
    );
}

export function openWorkspace(
    workspacePath: string,
): Promise<WorkspaceSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "openWorkspace",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommand<WorkspaceSnapshot>(
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
    if (!isTauriEnvironment()) {
        return Promise.resolve(null);
    }

    return invokeWorkspaceCommand<WorkspaceSnapshot | null>(
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
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "createWorkspaceFile",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommand<WorkspaceTabSnapshot>(
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
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "saveWorkspaceFile",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceVoidCommand(
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
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "renameWorkspaceFile",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommand<WorkspaceTabState>(
        "rename_workspace_file",
        "renameWorkspaceFile",
        options,
    );
}

export function deleteWorkspaceFile(options: {
    workspacePath: string;
    tabId: string;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "deleteWorkspaceFile",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceVoidCommand(
        "delete_workspace_file",
        "deleteWorkspaceFile",
        options,
    );
}

export function persistWorkspaceState(options: {
    workspacePath: string;
    activeTabId: string | null;
    splitView: WorkspaceSplitView | null;
    tabs: WorkspaceTabState[];
    archivedTabs: WorkspaceTabState[];
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve();
    }

    return invokeWorkspaceVoidCommand(
        "persist_workspace_state",
        "persistWorkspaceState",
        options,
    );
}

export function restoreArchivedWorkspaceTab(options: {
    workspacePath: string;
    tabId: string;
}): Promise<WorkspaceTabSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "restoreArchivedWorkspaceTab",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommand<WorkspaceTabSnapshot>(
        "restore_archived_workspace_tab",
        "restoreArchivedWorkspaceTab",
        options,
    );
}

export function restoreAllArchivedWorkspaceTabs(options: {
    workspacePath: string;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "restoreAllArchivedWorkspaceTabs",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceVoidCommand(
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
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "deleteArchivedWorkspaceTab",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceVoidCommand(
        "delete_archived_workspace_tab",
        "deleteArchivedWorkspaceTab",
        options,
    );
}

export function deleteAllArchivedWorkspaceTabs(options: {
    workspacePath: string;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "deleteAllArchivedWorkspaceTabs",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceVoidCommand(
        "delete_all_archived_workspace_tabs",
        "deleteAllArchivedWorkspaceTabs",
        options,
    );
}

export function setWorkspaceUnsavedChanges(
    hasUnsavedChanges: boolean,
): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve();
    }

    return invokeWorkspaceVoidCommand(
        "set_workspace_unsaved_changes",
        "setWorkspaceUnsavedChanges",
        {
            hasUnsavedChanges,
        },
    );
}
