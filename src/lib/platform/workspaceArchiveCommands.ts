import type { WorkspaceTabSnapshot } from "../../lib/workspace/workspace.type";
import { isTauriEnvironment } from "./runtime";
import {
    createDesktopShellRequiredError,
    invokeWorkspaceCommand,
    invokeWorkspaceVoidCommand,
} from "./workspaceCommandShared";

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
