import type {
    WorkspaceBootstrapResponse,
    WorkspaceExecutionHistoryEntry,
    WorkspaceSnapshot,
    WorkspaceSplitView,
    WorkspaceTabState,
} from "../workspace/workspace.type";
import { isTauriEnvironment } from "./runtime";
import {
    createDesktopShellRequiredError,
    invokeWorkspaceCommand,
    invokeWorkspaceVoidCommand,
} from "./workspaceCommandShared";

/**
 * Bootstraps the workspace by restoring the last saved workspace if available.
 *
 * Invokes the `bootstrap_workspace` Tauri command. Returns a default response
 * with null values when not running in the Tauri desktop shell.
 *
 * @returns The bootstrap response containing the last workspace path and snapshot
 * @throws {WorkspaceCommandError} If the command fails in the desktop shell
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
 * Opens a workspace at the specified path, persisting it as the current workspace.
 *
 * Invokes the `open_workspace` Tauri command.
 *
 * @param workspacePath - Absolute path to the workspace directory
 * @returns The full workspace snapshot
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
export function openWorkspace(
    workspacePath: string,
): Promise<WorkspaceSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(createDesktopShellRequiredError("openWorkspace"));
    }

    return invokeWorkspaceCommand<WorkspaceSnapshot>(
        "open_workspace",
        "openWorkspace",
        { workspacePath },
    );
}

/**
 * Refreshes the workspace by re-reading the snapshot from disk.
 *
 * Invokes the `refresh_workspace` Tauri command. Returns null instead of
 * rejecting when the workspace is not found.
 *
 * @param workspacePath - Absolute path to the workspace directory
 * @returns The refreshed workspace snapshot, or null if the workspace no longer exists
 * @throws {WorkspaceCommandError} If the command fails in the desktop shell
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
        { workspacePath },
    );
}

/**
 * Persists workspace state including active tab, split view, and all tab states.
 *
 * Invokes the `persist_workspace_state` Tauri command. No-ops when not
 * running in the Tauri desktop shell.
 *
 * @param options - State to persist
 * @param options.workspacePath - Absolute path to the workspace directory
 * @param options.activeTabId - Currently active tab ID
 * @param options.splitView - Split view state, or null if no split
 * @param options.tabs - Array of tab states to persist
 * @param options.archivedTabs - Array of archived tab states
 * @param options.executionHistory - Execution history entries
 * @throws {WorkspaceCommandError} If the command fails in the desktop shell
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

/**
 * Appends an execution history entry to the workspace.
 *
 * Invokes the `append_workspace_execution_history` Tauri command.
 *
 * @param options - Append options
 * @param options.workspacePath - Absolute path to the workspace directory
 * @param options.entry - The execution history entry to append
 * @returns Updated execution history entries
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
export function appendWorkspaceExecutionHistory(options: {
    workspacePath: string;
    entry: WorkspaceExecutionHistoryEntry;
}): Promise<WorkspaceExecutionHistoryEntry[]> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("appendWorkspaceExecutionHistory"),
        );
    }

    return invokeWorkspaceCommand<WorkspaceExecutionHistoryEntry[]>(
        "append_workspace_execution_history",
        "appendWorkspaceExecutionHistory",
        options,
    );
}

/**
 * Notifies the backend of unsaved changes state for exit guard behavior.
 *
 * Invokes the `set_workspace_unsaved_changes` Tauri command. No-ops when
 * not running in the Tauri desktop shell.
 *
 * @param hasUnsavedChanges - Whether the workspace has unsaved changes
 * @throws {WorkspaceCommandError} If the command fails in the desktop shell
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
        { hasUnsavedChanges },
    );
}
