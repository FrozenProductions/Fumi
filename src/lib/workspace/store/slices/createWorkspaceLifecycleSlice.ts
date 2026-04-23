import { persistWorkspaceState as persistWorkspaceStateCommand } from "../../../platform/workspace";
import { getErrorMessage } from "../../../shared/errorMessage";
import type { WorkspaceSession } from "../../workspace.type";
import { createBootstrapWorkspaceSessionAction } from "../lifecycle/workspaceLifecycleBootstrap";
import {
    createOpenWorkspaceDirectoryAction,
    createOpenWorkspacePathAction,
} from "../lifecycle/workspaceLifecycleOpen";
import { createRefreshWorkspaceFromFilesystemAction } from "../lifecycle/workspaceLifecycleRefresh";
import {
    createWorkspaceLifecycleRuntime,
    getPersistedWorkspaceTabs,
} from "../lifecycle/workspaceLifecycleSupport";
import { isMatchingWorkspacePath } from "../workspaceNavigation";
import type {
    WorkspaceLifecycleSlice,
    WorkspaceStoreSliceCreator,
} from "../workspaceStore.type";

export const createWorkspaceLifecycleSlice: WorkspaceStoreSliceCreator<
    WorkspaceLifecycleSlice
> = (set, get) => {
    const lifecycleRuntime = createWorkspaceLifecycleRuntime();

    return {
        bootstrapWorkspaceSession: createBootstrapWorkspaceSessionAction(
            set,
            get,
            lifecycleRuntime,
        ),
        persistWorkspaceState: async (): Promise<boolean> => {
            const { persistRevision, workspace } = get();

            if (!workspace) {
                return false;
            }

            try {
                await persistWorkspaceStateCommand({
                    workspacePath: workspace.workspacePath,
                    activeTabId: workspace.activeTabId,
                    splitView: workspace.splitView,
                    tabs: getPersistedWorkspaceTabs(get, workspace),
                    archivedTabs: workspace.archivedTabs,
                    executionHistory: workspace.executionHistory,
                });

                set((state) => ({
                    lastPersistedRevision: Math.max(
                        state.lastPersistedRevision,
                        persistRevision,
                    ),
                }));
                return true;
            } catch (error) {
                console.error("Failed to persist workspace state.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not persist the workspace state.",
                    ),
                });
                return false;
            }
        },
        replaceWorkspaceExecutionHistory: (workspacePath, entries): void => {
            let nextWorkspace: WorkspaceSession | null = null;

            set((state) => {
                if (!isMatchingWorkspacePath(state.workspace, workspacePath)) {
                    return {};
                }

                const currentWorkspace = state.workspace;

                if (!currentWorkspace) {
                    return {};
                }

                nextWorkspace = {
                    ...currentWorkspace,
                    executionHistory: entries,
                };

                return {
                    workspace: nextWorkspace,
                    persistRevision: state.persistRevision + 1,
                    lastPersistedRevision: state.persistRevision + 1,
                };
            });
        },
        refreshWorkspaceFromFilesystem:
            createRefreshWorkspaceFromFilesystemAction(
                set,
                get,
                lifecycleRuntime,
            ),
        openWorkspaceDirectory: createOpenWorkspaceDirectoryAction(set, get),
        openWorkspacePath: createOpenWorkspacePathAction(set, get),
    };
};
