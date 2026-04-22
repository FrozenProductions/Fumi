import type {
    WorkspaceBootstrapResponse,
    WorkspaceExecutionHistoryEntry,
    WorkspaceSnapshot,
    WorkspaceSplitView,
    WorkspaceTabState,
} from "../../lib/workspace/workspace.type";
import { isTauriEnvironment } from "./runtime";
import {
    createDesktopShellRequiredError,
    invokeWorkspaceCommand,
    invokeWorkspaceVoidCommand,
} from "./workspaceCommandShared";

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
        return Promise.reject(createDesktopShellRequiredError("openWorkspace"));
    }

    return invokeWorkspaceCommand<WorkspaceSnapshot>(
        "open_workspace",
        "openWorkspace",
        { workspacePath },
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
        { workspacePath },
    );
}

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
            createDesktopShellRequiredError("appendWorkspaceExecutionHistory"),
        );
    }

    return invokeWorkspaceCommand<WorkspaceExecutionHistoryEntry[]>(
        "append_workspace_execution_history",
        "appendWorkspaceExecutionHistory",
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
        { hasUnsavedChanges },
    );
}
