import { isTauriEnvironment } from "../../../lib/platform/runtime";
import { bootstrapWorkspace } from "../../../lib/platform/workspace";
import { getErrorMessage } from "../../../lib/shared/errorMessage";
import {
    persistRecentWorkspacePaths,
    updateRecentWorkspacePaths,
} from "../../../lib/workspace/persistence";
import {
    buildWorkspaceSession,
    getWorkspaceDirtyTabCount,
} from "../../../lib/workspace/session";
import type { WorkspaceLifecycleRuntime } from "./workspaceLifecycleSupport";
import type {
    WorkspaceStoreGet,
    WorkspaceStoreSet,
} from "./workspaceStore.type";

export function createBootstrapWorkspaceSessionAction(
    set: WorkspaceStoreSet,
    get: WorkspaceStoreGet,
    lifecycleRuntime: WorkspaceLifecycleRuntime,
): () => Promise<void> {
    return async (): Promise<void> => {
        if (lifecycleRuntime.hasBootstrappedWorkspaceSession) {
            return;
        }

        if (lifecycleRuntime.bootstrapWorkspacePromise) {
            return lifecycleRuntime.bootstrapWorkspacePromise;
        }

        if (!isTauriEnvironment()) {
            lifecycleRuntime.hasBootstrappedWorkspaceSession = true;
            set({
                workspace: null,
                dirtyTabCount: 0,
                transientTabCursorsById: {},
                persistRevision: 0,
                lastPersistedRevision: 0,
                errorMessage: null,
                isHydrated: true,
                isBootstrapping: false,
            });
            return;
        }

        lifecycleRuntime.bootstrapWorkspacePromise = (async () => {
            try {
                const bootstrapResponse = await bootstrapWorkspace();
                const nextWorkspace = bootstrapResponse.workspace
                    ? buildWorkspaceSession(bootstrapResponse.workspace)
                    : null;
                const nextRecentWorkspacePaths =
                    bootstrapResponse.lastWorkspacePath
                        ? updateRecentWorkspacePaths(
                              get().recentWorkspacePaths,
                              bootstrapResponse.lastWorkspacePath,
                          )
                        : get().recentWorkspacePaths;

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
            } catch (error) {
                set({
                    workspace: null,
                    dirtyTabCount: 0,
                    transientTabCursorsById: {},
                    persistRevision: 0,
                    lastPersistedRevision: 0,
                    errorMessage: getErrorMessage(
                        error,
                        "Could not restore the workspace session.",
                    ),
                    isHydrated: true,
                });
            } finally {
                lifecycleRuntime.hasBootstrappedWorkspaceSession = true;
                lifecycleRuntime.bootstrapWorkspacePromise = null;
                set({ isBootstrapping: false });
            }
        })();

        return lifecycleRuntime.bootstrapWorkspacePromise;
    };
}
