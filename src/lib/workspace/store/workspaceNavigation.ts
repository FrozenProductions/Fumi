import { confirmAction } from "../../platform/dialog";
import { hasWorkspaceDraftChanges } from "../session/session";
import type { WorkspaceSession, WorkspaceTab } from "../workspace.type";

/**
 * Returns whether the workspace path matches the given path string.
 */
export function isMatchingWorkspacePath(
    workspace: WorkspaceSession | null,
    workspacePath: string,
): boolean {
    return workspace?.workspacePath === workspacePath;
}

/**
 * Prompts the user to confirm before switching away from a workspace with unsaved changes.
 *
 * @returns True if the switch should proceed (no unsaved changes or user confirmed).
 */
export async function shouldProceedWithWorkspaceSwitch(
    workspace: WorkspaceSession | null,
): Promise<boolean> {
    const hasUnsavedChanges = workspace
        ? hasWorkspaceDraftChanges(workspace)
        : false;

    if (!workspace || !hasUnsavedChanges) {
        return true;
    }

    return confirmAction(
        "Discard unsaved changes and choose a different workspace?",
    );
}

/**
 * Returns the active tab from the workspace, or null if none is active.
 */
export function getActiveTabFromWorkspace(
    workspace: WorkspaceSession | null,
): WorkspaceTab | null {
    if (!workspace) {
        return null;
    }

    const activeTab = workspace.tabs.find(
        (tab) => tab.id === workspace.activeTabId,
    );

    return activeTab ?? null;
}
