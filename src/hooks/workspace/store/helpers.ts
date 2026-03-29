import { confirmAction } from "../../../lib/platform/dialog";
import { hasWorkspaceDraftChanges } from "../../../lib/workspace/session";
import type {
    WorkspaceSession,
    WorkspaceTab,
} from "../../../types/workspace/session";

export function isMatchingWorkspacePath(
    workspace: WorkspaceSession | null,
    workspacePath: string,
): boolean {
    return workspace?.workspacePath === workspacePath;
}

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
