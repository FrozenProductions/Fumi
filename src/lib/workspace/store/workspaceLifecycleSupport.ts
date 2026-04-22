import { openWorkspace as openWorkspaceCommand } from "../../platform/workspace";
import {
    persistRecentWorkspacePaths,
    updateRecentWorkspacePaths,
} from "../persistence";
import {
    buildWorkspaceSession,
    clampCursorToContent,
    getWorkspaceDirtyTabCount,
    serializeTabState,
} from "../session/session";
import type { WorkspaceSession } from "../workspace.type";
import type {
    WorkspaceStoreGet,
    WorkspaceStoreSet,
} from "./workspaceStore.type";

export type WorkspaceLifecycleRuntime = {
    bootstrapWorkspacePromise: Promise<void> | null;
    hasBootstrappedWorkspaceSession: boolean;
    latestWorkspaceRefreshRequestId: number;
};

export function createWorkspaceLifecycleRuntime(): WorkspaceLifecycleRuntime {
    return {
        bootstrapWorkspacePromise: null,
        hasBootstrappedWorkspaceSession: false,
        latestWorkspaceRefreshRequestId: 0,
    };
}

export function getPersistedWorkspaceTabs(
    get: WorkspaceStoreGet,
    workspace: WorkspaceSession,
) {
    const { transientTabCursorsById } = get();

    return workspace.tabs.map((tab) => {
        const transientCursor = transientTabCursorsById[tab.id];

        if (!transientCursor) {
            return serializeTabState(tab);
        }

        return serializeTabState({
            ...tab,
            cursor: clampCursorToContent(tab.content, transientCursor),
        });
    });
}

export async function persistCurrentWorkspaceBeforeSwitch(
    get: WorkspaceStoreGet,
): Promise<boolean> {
    const { workspace, persistWorkspaceState } = get();

    if (!workspace) {
        return true;
    }

    return persistWorkspaceState();
}

export async function openResolvedWorkspacePath(
    set: WorkspaceStoreSet,
    get: WorkspaceStoreGet,
    workspacePath: string,
): Promise<void> {
    const openedWorkspace = await openWorkspaceCommand(workspacePath);
    const nextWorkspace = buildWorkspaceSession(openedWorkspace);
    const nextRecentWorkspacePaths = updateRecentWorkspacePaths(
        get().recentWorkspacePaths,
        workspacePath,
    );

    persistRecentWorkspacePaths(nextRecentWorkspacePaths);

    set({
        workspace: nextWorkspace,
        dirtyTabCount: getWorkspaceDirtyTabCount(nextWorkspace),
        transientTabCursorsById: {},
        recentWorkspacePaths: nextRecentWorkspacePaths,
        persistRevision: 0,
        lastPersistedRevision: 0,
        errorMessage: null,
        isHydrated: true,
    });
}
