import { invoke } from "@tauri-apps/api/core";
import type {
    WorkspaceBootstrapResponse,
    WorkspaceCursorState,
    WorkspaceSnapshot,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../../types/workspace/workspace";
import { isTauriEnvironment } from "./runtime";

const DESKTOP_SHELL_REQUIRED_ERROR =
    "Workspace commands require the Tauri desktop shell.";

export function bootstrapWorkspace(): Promise<WorkspaceBootstrapResponse> {
    if (!isTauriEnvironment()) {
        return Promise.resolve({
            lastWorkspacePath: null,
            workspace: null,
        });
    }

    return invoke<WorkspaceBootstrapResponse>("bootstrap_workspace");
}

export function openWorkspace(
    workspacePath: string,
): Promise<WorkspaceSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(new Error(DESKTOP_SHELL_REQUIRED_ERROR));
    }

    return invoke<WorkspaceSnapshot>("open_workspace", {
        workspacePath,
    });
}

export function refreshWorkspace(
    workspacePath: string,
): Promise<WorkspaceSnapshot | null> {
    if (!isTauriEnvironment()) {
        return Promise.resolve(null);
    }

    return invoke<WorkspaceSnapshot | null>("refresh_workspace", {
        workspacePath,
    });
}

export function createWorkspaceFile(options: {
    workspacePath: string;
    fileName?: string;
    initialContent?: string;
}): Promise<WorkspaceTabSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(new Error(DESKTOP_SHELL_REQUIRED_ERROR));
    }

    return invoke<WorkspaceTabSnapshot>("create_workspace_file", options);
}

export function saveWorkspaceFile(options: {
    workspacePath: string;
    tabId: string;
    content: string;
    cursor: WorkspaceCursorState;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(new Error(DESKTOP_SHELL_REQUIRED_ERROR));
    }

    return invoke<void>("save_workspace_file", options);
}

export function renameWorkspaceFile(options: {
    workspacePath: string;
    tabId: string;
    fileName: string;
}): Promise<WorkspaceTabState> {
    if (!isTauriEnvironment()) {
        return Promise.reject(new Error(DESKTOP_SHELL_REQUIRED_ERROR));
    }

    return invoke<WorkspaceTabState>("rename_workspace_file", options);
}

export function persistWorkspaceState(options: {
    workspacePath: string;
    activeTabId: string | null;
    tabs: WorkspaceTabState[];
    archivedTabs: WorkspaceTabState[];
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve();
    }

    return invoke<void>("persist_workspace_state", options);
}

export function restoreArchivedWorkspaceTab(options: {
    workspacePath: string;
    tabId: string;
}): Promise<WorkspaceTabSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(new Error(DESKTOP_SHELL_REQUIRED_ERROR));
    }

    return invoke<WorkspaceTabSnapshot>(
        "restore_archived_workspace_tab",
        options,
    );
}

export function deleteArchivedWorkspaceTab(options: {
    workspacePath: string;
    tabId: string;
    fileName: string;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(new Error(DESKTOP_SHELL_REQUIRED_ERROR));
    }

    return invoke<void>("delete_archived_workspace_tab", options);
}

export function setWorkspaceUnsavedChanges(
    hasUnsavedChanges: boolean,
): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve();
    }

    return invoke<void>("set_workspace_unsaved_changes", {
        hasUnsavedChanges,
    });
}
