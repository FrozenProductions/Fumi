import {
    DEFAULT_WORKSPACE_SPLIT_RATIO,
    MAX_WORKSPACE_TAB_NAME_LENGTH,
} from "../../../constants/workspace/workspace";
import { confirmAction } from "../../../lib/platform/dialog";
import {
    createWorkspaceFile as createWorkspaceFileCommand,
    deleteAllArchivedWorkspaceTabs as deleteAllArchivedWorkspaceTabsCommand,
    deleteArchivedWorkspaceTab as deleteArchivedWorkspaceTabCommand,
    deleteWorkspaceFile as deleteWorkspaceFileCommand,
    renameWorkspaceFile as renameWorkspaceFileCommand,
    restoreAllArchivedWorkspaceTabs as restoreAllArchivedWorkspaceTabsCommand,
    restoreArchivedWorkspaceTab as restoreArchivedWorkspaceTabCommand,
} from "../../../lib/platform/workspace";
import { getErrorMessage } from "../../../lib/shared/errorMessage";
import { buildDuplicateWorkspaceTabDraft } from "../../../lib/workspace/duplicate";
import {
    buildWorkspaceFileName,
    clampWorkspaceTabBaseName,
    isWorkspaceTabBaseNameTooLong,
    splitWorkspaceFileName,
} from "../../../lib/workspace/fileName";
import {
    getWorkspacePersistSignature,
    markWorkspacePersistedSignature,
} from "../../../lib/workspace/persistence";
import {
    getNextActiveTabId,
    removedTabFromSplitView,
    reorderWorkspaceTabs,
    serializeTabState,
    updateWorkspaceTab,
    upsertWorkspaceTab,
} from "../../../lib/workspace/session";
import { normalizeWorkspaceSplitRatio } from "../../../lib/workspace/splitView";
import type {
    WorkspacePaneId,
    WorkspaceSession,
} from "../../../lib/workspace/workspace.type";
import { isMatchingWorkspacePath } from "./helpers";
import type {
    WorkspaceStoreSliceCreator,
    WorkspaceStoreUpdater,
    WorkspaceTabSlice,
} from "./workspaceStore.type";

export const createWorkspaceTabSlice: WorkspaceStoreSliceCreator<
    WorkspaceTabSlice
> = (set, get) => {
    const getPrimaryPaneTabId = (
        workspace: WorkspaceSession,
        secondaryTabIds: string[],
        fallbackTabId: string | null,
    ): string | null => {
        const secondaryTabIdSet = new Set(secondaryTabIds);

        if (
            fallbackTabId &&
            !secondaryTabIdSet.has(fallbackTabId) &&
            workspace.tabs.some((tab) => tab.id === fallbackTabId)
        ) {
            return fallbackTabId;
        }

        return (
            workspace.tabs.find((tab) => !secondaryTabIdSet.has(tab.id))?.id ??
            null
        );
    };

    const updateWorkspaceForPath = (
        workspacePath: string,
        updater: WorkspaceStoreUpdater,
    ): WorkspaceSession | null => {
        let nextWorkspace: WorkspaceSession | null = null;

        set((state) => {
            if (!isMatchingWorkspacePath(state.workspace, workspacePath)) {
                return {};
            }

            const currentWorkspace = state.workspace;

            if (!currentWorkspace) {
                return {};
            }

            nextWorkspace = updater(currentWorkspace);

            return {
                workspace: nextWorkspace,
                errorMessage: null,
            };
        });

        return nextWorkspace;
    };

    const markNextWorkspaceAsPersisted = (
        nextWorkspace: WorkspaceSession | null,
    ): void => {
        if (!nextWorkspace) {
            return;
        }

        markWorkspacePersistedSignature(
            getWorkspacePersistSignature(nextWorkspace),
        );
    };

    return {
        createWorkspaceFile: async (): Promise<void> => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            try {
                const createdTab = await createWorkspaceFileCommand({
                    workspacePath: workspace.workspacePath,
                });

                const nextWorkspace = updateWorkspaceForPath(
                    workspace.workspacePath,
                    (currentWorkspace) =>
                        upsertWorkspaceTab(currentWorkspace, createdTab),
                );

                markNextWorkspaceAsPersisted(nextWorkspace);
            } catch (error) {
                console.error("Failed to create workspace file.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not create a new workspace file.",
                    ),
                });
            }
        },
        addWorkspaceScriptTab: async (
            fileName: string,
            content: string,
        ): Promise<boolean> => {
            const { workspace } = get();

            if (!workspace) {
                return false;
            }

            const { baseName, extension } = splitWorkspaceFileName(fileName);
            const limitedFileName = buildWorkspaceFileName(
                clampWorkspaceTabBaseName(baseName.trim()),
                extension,
            );

            try {
                const createdTab = await createWorkspaceFileCommand({
                    workspacePath: workspace.workspacePath,
                    fileName: limitedFileName,
                    initialContent: content,
                });

                const nextWorkspace = updateWorkspaceForPath(
                    workspace.workspacePath,
                    (currentWorkspace) =>
                        upsertWorkspaceTab(currentWorkspace, createdTab),
                );

                markNextWorkspaceAsPersisted(nextWorkspace);
                return true;
            } catch (error) {
                console.error("Failed to add script to workspace.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not add the script to the current workspace.",
                    ),
                });
                return false;
            }
        },
        duplicateWorkspaceTab: async (tabId: string): Promise<void> => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            const tabToDuplicate = workspace.tabs.find(
                (tab) => tab.id === tabId,
            );

            if (!tabToDuplicate) {
                return;
            }

            try {
                const duplicateDraft =
                    buildDuplicateWorkspaceTabDraft(tabToDuplicate);
                const duplicatedTab = await createWorkspaceFileCommand({
                    workspacePath: workspace.workspacePath,
                    fileName: duplicateDraft.fileName,
                    initialContent: duplicateDraft.initialContent,
                });

                const nextWorkspace = updateWorkspaceForPath(
                    workspace.workspacePath,
                    (currentWorkspace) =>
                        upsertWorkspaceTab(currentWorkspace, duplicatedTab),
                );

                markNextWorkspaceAsPersisted(nextWorkspace);
            } catch (error) {
                console.error("Failed to duplicate workspace tab.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not duplicate the selected tab.",
                    ),
                });
            }
        },
        archiveWorkspaceTab: async (tabId: string): Promise<void> => {
            const { workspace } = get();

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
                    void get().persistWorkspaceState();
                }
            } catch (error) {
                console.error("Failed to archive workspace tab.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not archive the selected tab.",
                    ),
                });
            }
        },
        deleteWorkspaceTab: async (tabId: string): Promise<void> => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            const tabIndex = workspace.tabs.findIndex(
                (tab) => tab.id === tabId,
            );

            if (tabIndex < 0) {
                return;
            }

            const tabToDelete = workspace.tabs[tabIndex];
            const shouldDelete =
                tabToDelete.content === tabToDelete.savedContent
                    ? await confirmAction(
                          `Delete ${tabToDelete.fileName}? This permanently removes the file from the workspace.`,
                      )
                    : await confirmAction(
                          `Delete ${tabToDelete.fileName}? Unsaved changes will be discarded and the file will be permanently removed from the workspace.`,
                      );

            if (!shouldDelete) {
                return;
            }

            try {
                await deleteWorkspaceFileCommand({
                    workspacePath: workspace.workspacePath,
                    tabId,
                });

                const nextWorkspace = updateWorkspaceForPath(
                    workspace.workspacePath,
                    (currentWorkspace) => {
                        const currentDeletedTabIndex =
                            currentWorkspace.tabs.findIndex(
                                (tab) => tab.id === tabId,
                            );

                        if (currentDeletedTabIndex < 0) {
                            return currentWorkspace;
                        }

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
                            activeTabId:
                                currentWorkspace.activeTabId === tabId
                                    ? getNextActiveTabId(
                                          nextTabs,
                                          currentDeletedTabIndex,
                                      )
                                    : currentWorkspace.activeTabId,
                            splitView: nextSplitView,
                            tabs: nextTabs,
                        };
                    },
                );

                markNextWorkspaceAsPersisted(nextWorkspace);
            } catch (error) {
                console.error("Failed to delete workspace tab.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not delete the selected tab.",
                    ),
                });
            }
        },
        restoreArchivedWorkspaceTab: async (tabId: string): Promise<void> => {
            const {
                workspace,
                persistWorkspaceState,
                refreshWorkspaceFromFilesystem,
            } = get();

            if (!workspace) {
                return;
            }

            try {
                const didPersist = await persistWorkspaceState();

                if (!didPersist) {
                    return;
                }

                await restoreArchivedWorkspaceTabCommand({
                    workspacePath: workspace.workspacePath,
                    tabId,
                });
                await refreshWorkspaceFromFilesystem();
                set({ errorMessage: null });
            } catch (error) {
                console.error(
                    "Failed to restore archived workspace tab.",
                    error,
                );
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not restore the archived tab.",
                    ),
                });
            }
        },
        restoreAllArchivedWorkspaceTabs: async (): Promise<void> => {
            const {
                workspace,
                persistWorkspaceState,
                refreshWorkspaceFromFilesystem,
            } = get();

            if (!workspace || workspace.archivedTabs.length === 0) {
                return;
            }

            try {
                const didPersist = await persistWorkspaceState();

                if (!didPersist) {
                    return;
                }

                await restoreAllArchivedWorkspaceTabsCommand({
                    workspacePath: workspace.workspacePath,
                });
                await refreshWorkspaceFromFilesystem();
                set({ errorMessage: null });
            } catch (error) {
                console.error(
                    "Failed to restore all archived workspace tabs.",
                    error,
                );
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not restore the archived tabs.",
                    ),
                });
            }
        },
        deleteArchivedWorkspaceTab: async (tabId: string): Promise<void> => {
            const {
                workspace,
                persistWorkspaceState,
                refreshWorkspaceFromFilesystem,
            } = get();

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
                const didPersist = await persistWorkspaceState();

                if (!didPersist) {
                    return;
                }

                await deleteArchivedWorkspaceTabCommand({
                    workspacePath: workspace.workspacePath,
                    tabId,
                    fileName: archivedTab.fileName,
                });
                await refreshWorkspaceFromFilesystem();
                set({ errorMessage: null });
            } catch (error) {
                console.error(
                    "Failed to delete archived workspace tab.",
                    error,
                );
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not delete the archived tab.",
                    ),
                });
            }
        },
        deleteAllArchivedWorkspaceTabs: async (): Promise<void> => {
            const {
                workspace,
                persistWorkspaceState,
                refreshWorkspaceFromFilesystem,
            } = get();

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
                const didPersist = await persistWorkspaceState();

                if (!didPersist) {
                    return;
                }

                await deleteAllArchivedWorkspaceTabsCommand({
                    workspacePath: workspace.workspacePath,
                });
                await refreshWorkspaceFromFilesystem();
                set({ errorMessage: null });
            } catch (error) {
                console.error(
                    "Failed to delete all archived workspace tabs.",
                    error,
                );
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not delete the archived tabs.",
                    ),
                });
            }
        },
        renameWorkspaceTab: async (
            tabId: string,
            nextBaseName: string,
        ): Promise<boolean> => {
            const { workspace } = get();

            if (!workspace) {
                return false;
            }

            const tab = workspace.tabs.find((item) => item.id === tabId);

            if (!tab) {
                return false;
            }

            const trimmedBaseName = nextBaseName.trim();

            if (!trimmedBaseName) {
                return false;
            }

            if (isWorkspaceTabBaseNameTooLong(trimmedBaseName)) {
                set({
                    errorMessage: `File name cannot exceed ${MAX_WORKSPACE_TAB_NAME_LENGTH} characters.`,
                });
                return false;
            }

            const { extension } = splitWorkspaceFileName(tab.fileName);
            const nextFileName = buildWorkspaceFileName(
                trimmedBaseName,
                extension,
            );

            if (nextFileName === tab.fileName) {
                set({ errorMessage: null });
                return true;
            }

            try {
                const renamedTab = await renameWorkspaceFileCommand({
                    workspacePath: workspace.workspacePath,
                    tabId,
                    fileName: nextFileName,
                });

                const nextWorkspace = updateWorkspaceForPath(
                    workspace.workspacePath,
                    (currentWorkspace) =>
                        updateWorkspaceTab(
                            currentWorkspace,
                            tabId,
                            (currentTab) =>
                                currentTab.id === renamedTab.id
                                    ? {
                                          ...currentTab,
                                          fileName: renamedTab.fileName,
                                      }
                                    : currentTab,
                        ),
                );

                markNextWorkspaceAsPersisted(nextWorkspace);
                return true;
            } catch (error) {
                console.error("Failed to rename workspace file.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not rename the selected file.",
                    ),
                });
                return false;
            }
        },
        selectWorkspaceTab: (tabId: string): void => {
            let hasSelectedTab = false;

            set((state) => {
                if (!state.workspace) {
                    return {};
                }

                if (!state.workspace.tabs.some((tab) => tab.id === tabId)) {
                    return {};
                }

                const splitView = state.workspace.splitView;
                let nextSplitView = splitView;
                const nextActiveTabId = tabId;

                if (splitView) {
                    const isInSecondary =
                        splitView.secondaryTabIds.includes(tabId);
                    const isInPrimary = !isInSecondary;

                    if (
                        isInSecondary &&
                        splitView.focusedPane === "secondary"
                    ) {
                        nextSplitView = {
                            ...splitView,
                            secondaryTabId: tabId,
                        };
                    } else if (
                        isInSecondary &&
                        splitView.focusedPane === "primary"
                    ) {
                        nextSplitView = {
                            ...splitView,
                            secondaryTabId: tabId,
                            focusedPane: "secondary",
                        };
                    } else if (
                        isInPrimary &&
                        splitView.focusedPane === "primary"
                    ) {
                        nextSplitView = {
                            ...splitView,
                            primaryTabId: tabId,
                        };
                    } else {
                        nextSplitView = {
                            ...splitView,
                            primaryTabId: tabId,
                            focusedPane: "primary",
                        };
                    }

                    const nextPrimary =
                        nextSplitView?.primaryTabId ?? splitView.primaryTabId;
                    if (nextSplitView?.secondaryTabIds.includes(nextPrimary)) {
                        const filteredSecondary =
                            nextSplitView.secondaryTabIds.filter(
                                (id) => id !== nextPrimary,
                            );
                        if (filteredSecondary.length === 0) {
                            nextSplitView = null;
                        } else {
                            nextSplitView = {
                                ...nextSplitView,
                                secondaryTabIds: filteredSecondary,
                                secondaryTabId: filteredSecondary.includes(
                                    nextSplitView.secondaryTabId,
                                )
                                    ? nextSplitView.secondaryTabId
                                    : (filteredSecondary[0] ??
                                      nextSplitView.secondaryTabId),
                            };
                        }
                    }
                }

                hasSelectedTab =
                    state.workspace.activeTabId !== nextActiveTabId ||
                    state.workspace.splitView !== nextSplitView;

                return {
                    workspace: {
                        ...state.workspace,
                        activeTabId: nextActiveTabId,
                        splitView: nextSplitView,
                    },
                };
            });

            if (hasSelectedTab) {
                void get().persistWorkspaceState();
            }
        },
        reorderWorkspaceTab: (
            draggedTabId: string,
            targetTabId: string,
        ): void => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            const nextWorkspace = updateWorkspaceForPath(
                workspace.workspacePath,
                (currentWorkspace) =>
                    reorderWorkspaceTabs(
                        currentWorkspace,
                        draggedTabId,
                        targetTabId,
                    ),
            );

            if (nextWorkspace && nextWorkspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
        openWorkspaceTabInPane: (
            tabId: string,
            pane: WorkspacePaneId,
        ): void => {
            set((state) => {
                if (!state.workspace) {
                    return {};
                }

                const { workspace } = state;

                if (!workspace.tabs.some((tab) => tab.id === tabId)) {
                    return {};
                }

                const existingSplit = workspace.splitView;

                if (existingSplit) {
                    if (pane === "secondary") {
                        let nextSecondaryTabIds =
                            existingSplit.secondaryTabIds.includes(tabId)
                                ? existingSplit.secondaryTabIds
                                : [...existingSplit.secondaryTabIds, tabId];
                        let nextPrimaryTabId = getPrimaryPaneTabId(
                            workspace,
                            nextSecondaryTabIds,
                            existingSplit.primaryTabId === tabId
                                ? null
                                : existingSplit.primaryTabId,
                        );

                        if (!nextPrimaryTabId) {
                            nextPrimaryTabId =
                                existingSplit.secondaryTabId === tabId
                                    ? (existingSplit.secondaryTabIds.find(
                                          (id) => id !== tabId,
                                      ) ?? null)
                                    : existingSplit.secondaryTabId;
                        }

                        if (!nextPrimaryTabId) {
                            return {
                                workspace: {
                                    ...workspace,
                                    activeTabId: tabId,
                                    splitView: null,
                                },
                            };
                        }

                        nextSecondaryTabIds = nextSecondaryTabIds.filter(
                            (id) => id !== nextPrimaryTabId,
                        );

                        const nextSplit = {
                            ...existingSplit,
                            primaryTabId: nextPrimaryTabId,
                            secondaryTabId: tabId,
                            secondaryTabIds: nextSecondaryTabIds,
                            splitRatio: existingSplit.splitRatio,
                            focusedPane: pane,
                        };

                        return {
                            workspace: {
                                ...workspace,
                                activeTabId: tabId,
                                splitView: nextSplit,
                            },
                        };
                    }

                    const nextSecondaryTabIds =
                        existingSplit.secondaryTabIds.filter(
                            (id) => id !== tabId,
                        );

                    const resolvedSecondaryTabIds =
                        nextSecondaryTabIds.length > 0
                            ? nextSecondaryTabIds
                            : existingSplit.primaryTabId !== tabId
                              ? [existingSplit.primaryTabId]
                              : [];

                    if (resolvedSecondaryTabIds.length === 0) {
                        return {
                            workspace: {
                                ...workspace,
                                activeTabId: tabId,
                                splitView: null,
                            },
                        };
                    }

                    const nextSplit = {
                        ...existingSplit,
                        primaryTabId: tabId,
                        secondaryTabId: resolvedSecondaryTabIds.includes(
                            existingSplit.secondaryTabId,
                        )
                            ? existingSplit.secondaryTabId
                            : (resolvedSecondaryTabIds[0] ??
                              existingSplit.secondaryTabId),
                        secondaryTabIds: resolvedSecondaryTabIds,
                        splitRatio: existingSplit.splitRatio,
                        focusedPane: pane,
                    };

                    return {
                        workspace: {
                            ...workspace,
                            activeTabId: tabId,
                            splitView: nextSplit,
                        },
                    };
                }

                const currentActiveTabId = workspace.activeTabId;

                if (!currentActiveTabId) {
                    return {
                        workspace: {
                            ...workspace,
                            activeTabId: tabId,
                        },
                    };
                }

                if (currentActiveTabId === tabId) {
                    const otherTabs = workspace.tabs.filter(
                        (tab) => tab.id !== tabId,
                    );

                    if (otherTabs.length === 0) {
                        return {};
                    }

                    const newSplit =
                        pane === "primary"
                            ? {
                                  direction: "vertical" as const,
                                  primaryTabId: tabId,
                                  secondaryTabId: otherTabs[0]?.id ?? tabId,
                                  secondaryTabIds: otherTabs.map(
                                      (tab) => tab.id,
                                  ),
                                  splitRatio: normalizeWorkspaceSplitRatio(
                                      DEFAULT_WORKSPACE_SPLIT_RATIO,
                                  ),
                                  focusedPane: pane,
                              }
                            : {
                                  direction: "vertical" as const,
                                  primaryTabId: otherTabs[0]?.id ?? tabId,
                                  secondaryTabId: tabId,
                                  secondaryTabIds: [tabId],
                                  splitRatio: normalizeWorkspaceSplitRatio(
                                      DEFAULT_WORKSPACE_SPLIT_RATIO,
                                  ),
                                  focusedPane: pane,
                              };

                    return {
                        workspace: {
                            ...workspace,
                            activeTabId: tabId,
                            splitView: newSplit,
                        },
                    };
                }

                const newSplit =
                    pane === "primary"
                        ? {
                              direction: "vertical" as const,
                              primaryTabId: tabId,
                              secondaryTabId: currentActiveTabId,
                              secondaryTabIds: workspace.tabs
                                  .filter((tab) => tab.id !== tabId)
                                  .map((tab) => tab.id),
                              splitRatio: normalizeWorkspaceSplitRatio(
                                  DEFAULT_WORKSPACE_SPLIT_RATIO,
                              ),
                              focusedPane: pane,
                          }
                        : {
                              direction: "vertical" as const,
                              primaryTabId: currentActiveTabId,
                              secondaryTabId: tabId,
                              secondaryTabIds: [tabId],
                              splitRatio: normalizeWorkspaceSplitRatio(
                                  DEFAULT_WORKSPACE_SPLIT_RATIO,
                              ),
                              focusedPane: pane,
                          };

                return {
                    workspace: {
                        ...workspace,
                        activeTabId: tabId,
                        splitView: newSplit,
                    },
                };
            });

            void get().persistWorkspaceState();
        },
        setWorkspaceSplitRatio: (splitRatio: number): void => {
            set((state) => {
                if (!state.workspace?.splitView) {
                    return {};
                }

                return {
                    workspace: {
                        ...state.workspace,
                        splitView: {
                            ...state.workspace.splitView,
                            splitRatio:
                                normalizeWorkspaceSplitRatio(splitRatio),
                        },
                    },
                };
            });
        },
        resetWorkspaceSplitView: (): void => {
            let didReset = false;

            set((state) => {
                if (!state.workspace?.splitView) {
                    return {};
                }

                if (
                    state.workspace.splitView.splitRatio ===
                    DEFAULT_WORKSPACE_SPLIT_RATIO
                ) {
                    return {};
                }

                didReset = true;

                return {
                    workspace: {
                        ...state.workspace,
                        splitView: {
                            ...state.workspace.splitView,
                            splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                        },
                    },
                };
            });

            if (didReset) {
                void get().persistWorkspaceState();
            }
        },
        toggleWorkspaceSplitView: (): void => {
            const { workspace } = get();

            if (!workspace?.activeTabId) {
                return;
            }

            if (workspace.splitView) {
                get().closeWorkspaceSplitView();
                return;
            }

            get().openWorkspaceTabInPane(workspace.activeTabId, "secondary");
        },
        focusWorkspacePane: (pane: WorkspacePaneId): void => {
            let didChange = false;

            set((state) => {
                if (!state.workspace?.splitView) {
                    return {};
                }

                const { splitView } = state.workspace;

                if (splitView.focusedPane === pane) {
                    return {};
                }

                const focusedTabId =
                    pane === "primary"
                        ? splitView.primaryTabId
                        : splitView.secondaryTabId;

                didChange = true;

                return {
                    workspace: {
                        ...state.workspace,
                        activeTabId: focusedTabId,
                        splitView: {
                            ...splitView,
                            focusedPane: pane,
                        },
                    },
                };
            });

            if (didChange) {
                void get().persistWorkspaceState();
            }
        },
        closeWorkspaceSplitView: (): void => {
            let didClose = false;

            set((state) => {
                if (!state.workspace?.splitView) {
                    return {};
                }

                const { splitView } = state.workspace;
                const keepTabId =
                    splitView.focusedPane === "primary"
                        ? splitView.primaryTabId
                        : splitView.secondaryTabId;

                didClose = true;

                return {
                    workspace: {
                        ...state.workspace,
                        activeTabId: keepTabId,
                        splitView: null,
                    },
                };
            });

            if (didClose) {
                void get().persistWorkspaceState();
            }
        },
    };
};
