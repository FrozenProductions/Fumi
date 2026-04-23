import { WORKSPACE_UNAVAILABLE_ERROR_MESSAGE } from "../../../../constants/workspace/workspace";
import { refreshWorkspace as refreshWorkspaceCommand } from "../../../platform/workspace";
import { getErrorMessage } from "../../../shared/errorMessage";
import {
    getWorkspaceDirtyTabCount,
    hasWorkspaceDraftChanges,
    mergeWorkspaceSession,
} from "../../session/session";
import type { WorkspaceSession } from "../../workspace.type";
import { isMatchingWorkspacePath } from "../workspaceNavigation";
import type {
    WorkspaceStoreGet,
    WorkspaceStoreSet,
} from "../workspaceStore.type";
import type { WorkspaceLifecycleRuntime } from "./workspaceLifecycleSupport";

/**
 * Creates the action that refreshes workspace state from the filesystem, merging with local drafts.
 */
export function createRefreshWorkspaceFromFilesystemAction(
    set: WorkspaceStoreSet,
    get: WorkspaceStoreGet,
    lifecycleRuntime: WorkspaceLifecycleRuntime,
): () => Promise<void> {
    return async (): Promise<void> => {
        const currentWorkspace = get().workspace;

        if (!currentWorkspace) {
            return;
        }

        const requestId = ++lifecycleRuntime.latestWorkspaceRefreshRequestId;
        const requestedWorkspacePath = currentWorkspace.workspacePath;

        try {
            const refreshedWorkspace = await refreshWorkspaceCommand(
                requestedWorkspacePath,
            );

            if (
                requestId !==
                    lifecycleRuntime.latestWorkspaceRefreshRequestId ||
                !isMatchingWorkspacePath(
                    get().workspace,
                    requestedWorkspacePath,
                )
            ) {
                return;
            }

            if (!refreshedWorkspace) {
                const latestWorkspace = get().workspace;

                if (
                    !latestWorkspace ||
                    latestWorkspace.workspacePath !== requestedWorkspacePath
                ) {
                    return;
                }

                if (hasWorkspaceDraftChanges(latestWorkspace)) {
                    set({ errorMessage: WORKSPACE_UNAVAILABLE_ERROR_MESSAGE });
                    return;
                }

                set({
                    workspace: null,
                    dirtyTabCount: 0,
                    transientTabCursorsById: {},
                    persistRevision: 0,
                    lastPersistedRevision: 0,
                    errorMessage: null,
                });
                return;
            }

            let nextWorkspace: WorkspaceSession | null = null;

            set((state) => {
                if (
                    !isMatchingWorkspacePath(
                        state.workspace,
                        requestedWorkspacePath,
                    )
                ) {
                    return {};
                }

                const latestWorkspace = state.workspace;

                if (!latestWorkspace) {
                    return {};
                }

                nextWorkspace = mergeWorkspaceSession(
                    latestWorkspace,
                    refreshedWorkspace,
                );

                return {
                    workspace: nextWorkspace,
                    dirtyTabCount: getWorkspaceDirtyTabCount(nextWorkspace),
                    transientTabCursorsById: Object.fromEntries(
                        Object.entries(state.transientTabCursorsById).filter(
                            ([tabId]) =>
                                nextWorkspace?.tabs.some(
                                    (tab) => tab.id === tabId,
                                ) ?? false,
                        ),
                    ),
                    persistRevision: state.persistRevision + 1,
                    lastPersistedRevision: state.persistRevision + 1,
                    errorMessage: null,
                };
            });
        } catch (error) {
            if (
                requestId !==
                    lifecycleRuntime.latestWorkspaceRefreshRequestId ||
                !isMatchingWorkspacePath(
                    get().workspace,
                    requestedWorkspacePath,
                )
            ) {
                return;
            }

            console.error("Failed to refresh workspace state.", error);
            set({
                errorMessage: getErrorMessage(
                    error,
                    "Could not refresh the workspace state.",
                ),
            });
        }
    };
}
