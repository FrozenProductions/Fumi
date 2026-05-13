import { confirmAction } from "../../../platform/core/dialog";
import {
    deleteAllArchivedWorkspaceTabs as deleteAllArchivedWorkspaceTabsCommand,
    deleteArchivedWorkspaceTab as deleteArchivedWorkspaceTabCommand,
    restoreAllArchivedWorkspaceTabs as restoreAllArchivedWorkspaceTabsCommand,
    restoreArchivedWorkspaceTab as restoreArchivedWorkspaceTabCommand,
} from "../../../platform/workspace/workspace";
import {
    normalizeSplitView,
    removedTabFromSplitView,
} from "../../session/sessionSplitView";
import {
    getNextActiveTabId,
    serializeTabState,
} from "../../session/tabs/sessionTabs";
import type { WorkspaceTab } from "../../session/tabs/sessionTabs.type";
import { createWorkspaceStoreSupport } from "../createWorkspaceStoreSupport";
import type {
    WorkspaceArchiveSlice,
    WorkspaceStoreSliceCreator,
} from "../workspaceStore.type";

function getFirstArchivedTabIndex(
    tabs: readonly WorkspaceTab[],
    archivedTabIds: ReadonlySet<string>,
): number {
    const archivedTabIndex = tabs.findIndex((tab) =>
        archivedTabIds.has(tab.id),
    );

    return Math.max(archivedTabIndex, 0);
}

/** Creates the workspace store slice responsible for archiving, restoring, and deleting archived workspace tabs. */
export const createWorkspaceArchiveSlice: WorkspaceStoreSliceCreator<
    WorkspaceArchiveSlice
> = (set, get) => {
    const { setWorkspaceError, updateWorkspaceForPath } =
        createWorkspaceStoreSupport(set, get);
    const archiveWorkspaceTabs = async (
        tabIds: readonly string[],
        confirmMessage: string,
        fallbackActiveTabId: string | null,
    ): Promise<void> => {
        const { workspace, persistWorkspaceState } = get();

        if (!workspace || tabIds.length === 0) {
            return;
        }

        try {
            const tabIdSet = new Set(tabIds);
            const tabsToArchive = workspace.tabs.filter((tab) =>
                tabIdSet.has(tab.id),
            );

            if (tabsToArchive.length === 0) {
                return;
            }

            const hasDraftChanges = tabsToArchive.some(
                (tab) => tab.content !== tab.savedContent,
            );
            const shouldDiscardChanges =
                !hasDraftChanges || (await confirmAction(confirmMessage));

            if (!shouldDiscardChanges) {
                return;
            }

            const nextWorkspace = updateWorkspaceForPath(
                workspace.workspacePath,
                (currentWorkspace) => {
                    const currentTabIdSet = new Set(tabIds);
                    const nextTabs = currentWorkspace.tabs.filter(
                        (tab) => !currentTabIdSet.has(tab.id),
                    );
                    const nextOpenTabIds = new Set(
                        nextTabs.map((tab) => tab.id),
                    );
                    const archivedTabsById = new Map(
                        currentWorkspace.archivedTabs.map(
                            (tab) => [tab.id, tab] as const,
                        ),
                    );
                    const archivedAt = Date.now();

                    for (const tab of currentWorkspace.tabs) {
                        if (!currentTabIdSet.has(tab.id)) {
                            continue;
                        }

                        archivedTabsById.set(tab.id, {
                            ...serializeTabState(tab),
                            archivedAt,
                        });
                    }

                    const nextActiveTabId =
                        fallbackActiveTabId &&
                        nextTabs.some((tab) => tab.id === fallbackActiveTabId)
                            ? fallbackActiveTabId
                            : getNextActiveTabId(
                                  nextTabs,
                                  getFirstArchivedTabIndex(
                                      currentWorkspace.tabs,
                                      currentTabIdSet,
                                  ),
                              );

                    return {
                        ...currentWorkspace,
                        activeTabId: nextActiveTabId,
                        splitView: normalizeSplitView(
                            currentWorkspace.splitView,
                            nextOpenTabIds,
                        ),
                        archivedTabs: [...archivedTabsById.values()],
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
                "Failed to archive workspace tabs.",
                "Could not archive the selected tabs.",
            );
        }
    };
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
        archiveAllWorkspaceTabs: async (options): Promise<void> => {
            const { workspace } = get();

            if (!workspace || workspace.tabs.length === 0) {
                return;
            }

            const tabIds =
                options?.scopeTabIds ?? workspace.tabs.map((tab) => tab.id);
            const confirmMessage = options?.scopeTabIds
                ? "Archive all tabs in this split pane? Unsaved changes will be discarded. You can restore them from Settings."
                : "Archive all tabs? Unsaved changes will be discarded. You can restore them from Settings.";

            await archiveWorkspaceTabs(tabIds, confirmMessage, null);
        },
        archiveOtherWorkspaceTabs: async (
            tabId: string,
            options,
        ): Promise<void> => {
            const { workspace } = get();

            if (!workspace?.tabs.some((tab) => tab.id === tabId)) {
                return;
            }

            const scopedTabIds = options?.scopeTabIds;
            const sourceTabs = scopedTabIds
                ? workspace.tabs.filter((tab) => scopedTabIds.includes(tab.id))
                : workspace.tabs;
            const otherTabIds = sourceTabs
                .filter((tab) => tab.id !== tabId)
                .map((tab) => tab.id);
            const confirmMessage = scopedTabIds
                ? "Archive other tabs in this split pane? Unsaved changes will be discarded. You can restore them from Settings."
                : "Archive other tabs? Unsaved changes will be discarded. You can restore them from Settings.";

            await archiveWorkspaceTabs(otherTabIds, confirmMessage, tabId);
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
