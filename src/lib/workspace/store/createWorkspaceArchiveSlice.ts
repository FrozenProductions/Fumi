import { confirmAction } from "../../platform/dialog";
import {
    deleteAllArchivedWorkspaceTabs as deleteAllArchivedWorkspaceTabsCommand,
    deleteArchivedWorkspaceTab as deleteArchivedWorkspaceTabCommand,
    restoreAllArchivedWorkspaceTabs as restoreAllArchivedWorkspaceTabsCommand,
    restoreArchivedWorkspaceTab as restoreArchivedWorkspaceTabCommand,
} from "../../platform/workspace";
import {
    getNextActiveTabId,
    removedTabFromSplitView,
    serializeTabState,
} from "../session/session";
import { createWorkspaceStoreSupport } from "./createWorkspaceStoreSupport";
import type {
    WorkspaceArchiveSlice,
    WorkspaceStoreSliceCreator,
} from "./workspaceStore.type";

export const createWorkspaceArchiveSlice: WorkspaceStoreSliceCreator<
    WorkspaceArchiveSlice
> = (set, get) => {
    const { setWorkspaceError, updateWorkspaceForPath } =
        createWorkspaceStoreSupport(set, get);
    const persistWorkspaceThenRun = async (
        callback: () => Promise<void>,
    ): Promise<boolean> => {
        const didPersist = await get().persistWorkspaceState();

        if (!didPersist) {
            return false;
        }

        await callback();
        await get().refreshWorkspaceFromFilesystem();
        set({ errorMessage: null });
        return true;
    };

    return {
        archiveWorkspaceTab: async (tabId: string): Promise<void> => {
            const { workspace, persistWorkspaceState } = get();

            if (!workspace) {
                return;
            }

            try {
                const archivedTabIndex = workspace.tabs.findIndex(
                    (tab) => tab.id === tabId,
                );

                if (archivedTabIndex < 0) {
                    return;
                }

                const tabToArchive = workspace.tabs[archivedTabIndex];
                const shouldDiscardChanges =
                    tabToArchive.content === tabToArchive.savedContent ||
                    (await confirmAction(
                        `Archive ${tabToArchive.fileName}? Unsaved changes will be discarded. You can restore it from Settings.`,
                    ));

                if (!shouldDiscardChanges) {
                    return;
                }

                const nextWorkspace = updateWorkspaceForPath(
                    workspace.workspacePath,
                    (currentWorkspace) => {
                        const currentArchivedTabIndex =
                            currentWorkspace.tabs.findIndex(
                                (tab) => tab.id === tabId,
                            );

                        if (currentArchivedTabIndex < 0) {
                            return currentWorkspace;
                        }

                        const currentTabToArchive =
                            currentWorkspace.tabs[currentArchivedTabIndex];
                        const nextTabs = currentWorkspace.tabs.filter(
                            (tab) => tab.id !== tabId,
                        );
                        const nextSplitView = currentWorkspace.splitView
                            ? removedTabFromSplitView(
                                  currentWorkspace.splitView,
                                  tabId,
                              )
                            : null;

                        return {
                            ...currentWorkspace,
                            activeTabId: getNextActiveTabId(
                                nextTabs,
                                currentArchivedTabIndex,
                            ),
                            splitView: nextSplitView,
                            archivedTabs: [
                                ...currentWorkspace.archivedTabs.filter(
                                    (tab) => tab.id !== tabId,
                                ),
                                {
                                    ...serializeTabState(currentTabToArchive),
                                    archivedAt: Date.now(),
                                },
                            ],
                            tabs: nextTabs,
                        };
                    },
                );

                if (nextWorkspace) {
                    await persistWorkspaceState();
                }
            } catch (error) {
                setWorkspaceError(
                    error,
                    "Failed to archive workspace tab.",
                    "Could not archive the selected tab.",
                );
            }
        },
        restoreArchivedWorkspaceTab: async (tabId: string): Promise<void> => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            try {
                const didPersistAndRefresh = await persistWorkspaceThenRun(
                    async () => {
                        await restoreArchivedWorkspaceTabCommand({
                            workspacePath: workspace.workspacePath,
                            tabId,
                        });
                    },
                );

                if (!didPersistAndRefresh) {
                    return;
                }
            } catch (error) {
                setWorkspaceError(
                    error,
                    "Failed to restore archived workspace tab.",
                    "Could not restore the archived tab.",
                );
            }
        },
        restoreAllArchivedWorkspaceTabs: async (): Promise<void> => {
            const { workspace } = get();

            if (!workspace || workspace.archivedTabs.length === 0) {
                return;
            }

            try {
                const didPersistAndRefresh = await persistWorkspaceThenRun(
                    async () => {
                        await restoreAllArchivedWorkspaceTabsCommand({
                            workspacePath: workspace.workspacePath,
                        });
                    },
                );

                if (!didPersistAndRefresh) {
                    return;
                }
            } catch (error) {
                setWorkspaceError(
                    error,
                    "Failed to restore all archived workspace tabs.",
                    "Could not restore the archived tabs.",
                );
            }
        },
        deleteArchivedWorkspaceTab: async (tabId: string): Promise<void> => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            const archivedTab = workspace.archivedTabs.find(
                (tab) => tab.id === tabId,
            );

            if (!archivedTab) {
                return;
            }

            try {
                const didPersistAndRefresh = await persistWorkspaceThenRun(
                    async () => {
                        await deleteArchivedWorkspaceTabCommand({
                            workspacePath: workspace.workspacePath,
                            tabId,
                            fileName: archivedTab.fileName,
                        });
                    },
                );

                if (!didPersistAndRefresh) {
                    return;
                }
            } catch (error) {
                setWorkspaceError(
                    error,
                    "Failed to delete archived workspace tab.",
                    "Could not delete the archived tab.",
                );
            }
        },
        deleteAllArchivedWorkspaceTabs: async (): Promise<void> => {
            const { workspace } = get();

            if (!workspace || workspace.archivedTabs.length === 0) {
                return;
            }

            const shouldDelete = await confirmAction(
                "Are you sure you want to permanently delete all archived tabs? This action cannot be undone.",
            );

            if (!shouldDelete) {
                return;
            }

            try {
                const didPersistAndRefresh = await persistWorkspaceThenRun(
                    async () => {
                        await deleteAllArchivedWorkspaceTabsCommand({
                            workspacePath: workspace.workspacePath,
                        });
                    },
                );

                if (!didPersistAndRefresh) {
                    return;
                }
            } catch (error) {
                setWorkspaceError(
                    error,
                    "Failed to delete all archived workspace tabs.",
                    "Could not delete the archived tabs.",
                );
            }
        },
    };
};
