import type { WorkspaceTabSnapshot } from "../workspace/workspace.type";
import { isTauriEnvironment } from "./runtime";
import {
    createDesktopShellRequiredError,
    invokeWorkspaceCommand,
    invokeWorkspaceVoidCommand,
} from "./workspaceCommandShared";

/**
 * Restores an archived workspace tab back to active tabs.
 *
 * Invokes the `restore_archived_workspace_tab` Tauri command.
 *
 * @param options - Restore options
 * @param options.workspacePath - Absolute path to the workspace directory
 * @param options.tabId - ID of the archived tab to restore
 * @returns The restored tab snapshot
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
export function restoreArchivedWorkspaceTab(options: {
    workspacePath: string;
    tabId: string;
}): Promise<WorkspaceTabSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("restoreArchivedWorkspaceTab"),
        );
    }

    return invokeWorkspaceCommand<WorkspaceTabSnapshot>(
        "restore_archived_workspace_tab",
        "restoreArchivedWorkspaceTab",
        options,
    );
}

/**
 * Restores all archived workspace tabs back to active tabs.
 *
 * Invokes the `restore_all_archived_workspace_tabs` Tauri command.
 *
 * @param options - Restore options
 * @param options.workspacePath - Absolute path to the workspace directory
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
export function restoreAllArchivedWorkspaceTabs(options: {
    workspacePath: string;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("restoreAllArchivedWorkspaceTabs"),
        );
    }

    return invokeWorkspaceVoidCommand(
        "restore_all_archived_workspace_tabs",
        "restoreAllArchivedWorkspaceTabs",
        options,
    );
}

/**
 * Deletes an archived workspace tab without restoring it.
 *
 * Invokes the `delete_archived_workspace_tab` Tauri command.
 *
 * @param options - Delete options
 * @param options.workspacePath - Absolute path to the workspace directory
 * @param options.tabId - ID of the archived tab to delete
 * @param options.fileName - File name of the archived tab
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
export function deleteArchivedWorkspaceTab(options: {
    workspacePath: string;
    tabId: string;
    fileName: string;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("deleteArchivedWorkspaceTab"),
        );
    }

    return invokeWorkspaceVoidCommand(
        "delete_archived_workspace_tab",
        "deleteArchivedWorkspaceTab",
        options,
    );
}

/**
 * Deletes all archived workspace tabs from disk and metadata.
 *
 * Invokes the `delete_all_archived_workspace_tabs` Tauri command.
 *
 * @param options - Delete options
 * @param options.workspacePath - Absolute path to the workspace directory
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
export function deleteAllArchivedWorkspaceTabs(options: {
    workspacePath: string;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("deleteAllArchivedWorkspaceTabs"),
        );
    }

    return invokeWorkspaceVoidCommand(
        "delete_all_archived_workspace_tabs",
        "deleteAllArchivedWorkspaceTabs",
        options,
    );
}
