import { WORKSPACE_UNAVAILABLE_ERROR_MESSAGE } from "../../../constants/workspace/workspace";
import { pickDirectory } from "../../../lib/platform/dialog";
import { isTauriEnvironment } from "../../../lib/platform/runtime";
import {
    bootstrapWorkspace,
    openWorkspace as openWorkspaceCommand,
    persistWorkspaceState as persistWorkspaceStateCommand,
    refreshWorkspace as refreshWorkspaceCommand,
} from "../../../lib/platform/workspace";
import { getErrorMessage } from "../../../lib/shared/errorMessage";
import {
    getWorkspacePersistSignature,
    markWorkspacePersistedSignature,
    persistRecentWorkspacePaths,
    updateRecentWorkspacePaths,
} from "../../../lib/workspace/persistence";
import {
    buildWorkspaceSession,
    hasWorkspaceDraftChanges,
    mergeWorkspaceSession,
    serializeTabState,
} from "../../../lib/workspace/session";
import type { WorkspaceSession } from "../../../lib/workspace/workspace.type";
import {
    isMatchingWorkspacePath,
    shouldProceedWithWorkspaceSwitch,
} from "./helpers";
import type {
    WorkspaceLifecycleSlice,
    WorkspaceStoreSliceCreator,
} from "./workspaceStore.type";

export const createWorkspaceLifecycleSlice: WorkspaceStoreSliceCreator<
    WorkspaceLifecycleSlice
> = (set, get) => {
    const lifecycleRuntime = {
        bootstrapWorkspacePromise: null as Promise<void> | null,
        hasBootstrappedWorkspaceSession: false,
        latestWorkspaceRefreshRequestId: 0,
    };
    const persistCurrentWorkspaceBeforeSwitch = async (): Promise<boolean> => {
        const { workspace, persistWorkspaceState } = get();

        if (!workspace) {
            return true;
        }

        return persistWorkspaceState();
    };

    const openResolvedWorkspacePath = async (
        workspacePath: string,
    ): Promise<void> => {
        const openedWorkspace = await openWorkspaceCommand(workspacePath);
        const nextWorkspace = buildWorkspaceSession(openedWorkspace);
        const nextRecentWorkspacePaths = updateRecentWorkspacePaths(
            get().recentWorkspacePaths,
            workspacePath,
        );

        persistRecentWorkspacePaths(nextRecentWorkspacePaths);
        markWorkspacePersistedSignature(
            getWorkspacePersistSignature(nextWorkspace),
        );

        set({
            workspace: nextWorkspace,
            recentWorkspacePaths: nextRecentWorkspacePaths,
            errorMessage: null,
            isHydrated: true,
        });
    };

    return {
        bootstrapWorkspaceSession: async (): Promise<void> => {
            if (lifecycleRuntime.hasBootstrappedWorkspaceSession) {
                return;
            }

            if (lifecycleRuntime.bootstrapWorkspacePromise) {
                return lifecycleRuntime.bootstrapWorkspacePromise;
            }

            if (!isTauriEnvironment()) {
                lifecycleRuntime.hasBootstrappedWorkspaceSession = true;
                markWorkspacePersistedSignature(null);
                set({
                    workspace: null,
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
                    markWorkspacePersistedSignature(
                        getWorkspacePersistSignature(nextWorkspace),
                    );

                    set({
                        workspace: nextWorkspace,
                        recentWorkspacePaths: nextRecentWorkspacePaths,
                        errorMessage: null,
                        isHydrated: true,
                    });
                } catch (error) {
                    markWorkspacePersistedSignature(null);
                    set({
                        workspace: null,
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
        },
        persistWorkspaceState: async (): Promise<boolean> => {
            const { workspace } = get();

            if (!workspace) {
                return false;
            }

            try {
                const workspaceSignature =
                    getWorkspacePersistSignature(workspace);

                await persistWorkspaceStateCommand({
                    workspacePath: workspace.workspacePath,
                    activeTabId: workspace.activeTabId,
                    splitView: workspace.splitView,
                    tabs: workspace.tabs.map(serializeTabState),
                    archivedTabs: workspace.archivedTabs,
                });

                markWorkspacePersistedSignature(workspaceSignature);
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
        refreshWorkspaceFromFilesystem: async (): Promise<void> => {
            const currentWorkspace = get().workspace;

            if (!currentWorkspace) {
                return;
            }

            const requestId =
                ++lifecycleRuntime.latestWorkspaceRefreshRequestId;
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
                        set({
                            errorMessage: WORKSPACE_UNAVAILABLE_ERROR_MESSAGE,
                        });
                        return;
                    }

                    markWorkspacePersistedSignature(null);
                    set({
                        workspace: null,
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
                        errorMessage: null,
                    };
                });

                if (nextWorkspace) {
                    markWorkspacePersistedSignature(
                        getWorkspacePersistSignature(nextWorkspace),
                    );
                }
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
        },
        openWorkspaceDirectory: async (): Promise<void> => {
            const { workspace } = get();

            try {
                const shouldSwitchWorkspace =
                    await shouldProceedWithWorkspaceSwitch(workspace);

                if (!shouldSwitchWorkspace) {
                    return;
                }

                const pickedWorkspacePath = await pickDirectory(
                    workspace?.workspacePath ?? undefined,
                );

                if (!pickedWorkspacePath) {
                    return;
                }

                if (workspace?.workspacePath === pickedWorkspacePath) {
                    set({ errorMessage: null });
                    return;
                }

                const didPersistCurrentWorkspace =
                    await persistCurrentWorkspaceBeforeSwitch();

                if (!didPersistCurrentWorkspace) {
                    return;
                }

                await openResolvedWorkspacePath(pickedWorkspacePath);
            } catch (error) {
                console.error("Failed to open workspace.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not open the selected workspace.",
                    ),
                });
            }
        },
        openWorkspacePath: async (workspacePath: string): Promise<void> => {
            const { workspace } = get();
            const trimmedWorkspacePath = workspacePath.trim();

            if (!trimmedWorkspacePath) {
                return;
            }

            try {
                const shouldSwitchWorkspace =
                    await shouldProceedWithWorkspaceSwitch(workspace);

                if (!shouldSwitchWorkspace) {
                    return;
                }

                if (workspace?.workspacePath === trimmedWorkspacePath) {
                    set({ errorMessage: null });
                    return;
                }

                const didPersistCurrentWorkspace =
                    await persistCurrentWorkspaceBeforeSwitch();

                if (!didPersistCurrentWorkspace) {
                    return;
                }

                await openResolvedWorkspacePath(trimmedWorkspacePath);
            } catch (error) {
                console.error("Failed to open workspace.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not open the selected workspace.",
                    ),
                });
            }
        },
    };
};
