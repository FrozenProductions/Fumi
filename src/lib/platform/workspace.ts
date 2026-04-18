import { invoke } from "@tauri-apps/api/core";
import type {
    DroppedWorkspaceScriptDraft,
    WorkspaceBootstrapResponse,
    WorkspaceCursorState,
    WorkspaceExecutionHistoryEntry,
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

/**
 * Bootstraps the workspace by loading the last session or returning empty state.
 *
 * @returns Bootstrap response with last workspace path and workspace snapshot
 */
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

/**
 * Opens a workspace at the specified path.
 *
 * @param workspacePath - Absolute path to the workspace directory
 * @returns Complete workspace snapshot with tabs and state
 */
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

/**
 * Refreshes the workspace state from disk, detecting external file changes.
 *
 * @param workspacePath - Path to the workspace
 * @returns Updated snapshot, or null if workspace no longer exists
 */
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

/**
 * Creates a new file in the workspace.
 *
 * @param options - File creation options
 * @param options.workspacePath - Path to the workspace
 * @param options.fileName - Optional initial file name
 * @param options.initialContent - Optional initial content
 * @returns The created tab snapshot
 */
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

/**
 * Imports a file from an external path into the workspace.
 *
 * @param options - Import options
 * @param options.filePath - Source file path to import
 * @returns Draft script state for the imported file
 */
export function importWorkspaceFile(options: {
    filePath: string;
}): Promise<DroppedWorkspaceScriptDraft> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "importWorkspaceFile",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommand<DroppedWorkspaceScriptDraft>(
        "import_workspace_file",
        "importWorkspaceFile",
        options,
    );
}

/**
 * Saves a workspace file with current content and cursor state.
 *
 * @param options - Save options
 * @param options.workspacePath - Path to the workspace
 * @param options.tabId - ID of the tab to save
 * @param options.content - File content to persist
 * @param options.cursor - Current cursor and scroll state
 */
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

/**
 * Renames a file in the workspace.
 *
 * @param options - Rename options
 * @param options.workspacePath - Path to the workspace
 * @param options.tabId - ID of the tab to rename
 * @param options.fileName - New file name
 * @returns Updated tab state with new file name
 */
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

/**
 * Deletes a file from the workspace.
 *
 * @param options - Delete options
 * @param options.workspacePath - Path to the workspace
 * @param options.tabId - ID of the tab to delete
 */
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

/**
 * Persists the workspace UI state including tabs, split view, and ordering.
 *
 * @param options - State to persist
 * @param options.workspacePath - Path to the workspace
 * @param options.activeTabId - Currently active tab ID
 * @param options.splitView - Current split view configuration
 * @param options.tabs - Ordered array of open tab states
 * @param options.archivedTabs - Ordered array of archived tab states
 */
export function persistWorkspaceState(options: {
    workspacePath: string;
    activeTabId: string | null;
    splitView: WorkspaceSplitView | null;
    tabs: WorkspaceTabState[];
    archivedTabs: WorkspaceTabState[];
    executionHistory: WorkspaceExecutionHistoryEntry[];
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

export function appendWorkspaceExecutionHistory(options: {
    workspacePath: string;
    entry: WorkspaceExecutionHistoryEntry;
}): Promise<WorkspaceExecutionHistoryEntry[]> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new WorkspaceCommandError({
                operation: "appendWorkspaceExecutionHistory",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeWorkspaceCommand<WorkspaceExecutionHistoryEntry[]>(
        "append_workspace_execution_history",
        "appendWorkspaceExecutionHistory",
        options,
    );
}

/**
 * Restores an archived tab back into the workspace.
 *
 * @param options - Restore options
 * @param options.workspacePath - Path to the workspace
 * @param options.tabId - ID of the archived tab to restore
 * @returns The restored tab snapshot
 */
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

/**
 * Restores all archived tabs back into the workspace.
 *
 * @param options - Restore options
 * @param options.workspacePath - Path to the workspace
 */
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

/**
 * Deletes an archived tab from the archive.
 *
 * @param options - Delete options
 * @param options.workspacePath - Path to the workspace
 * @param options.tabId - ID of the tab to delete from archive
 * @param options.fileName - File name for verification
 */
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

/**
 * Deletes all archived tabs from the archive.
 *
 * @param options - Delete options
 * @param options.workspacePath - Path to the workspace
 */
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

/**
 * Notifies the backend of unsaved changes state.
 *
 * @param hasUnsavedChanges - Whether there are unsaved changes
 */
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
