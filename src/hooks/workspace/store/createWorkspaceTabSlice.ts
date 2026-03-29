import { MAX_WORKSPACE_TAB_NAME_LENGTH } from "../../../constants/workspace/workspace";
import { confirmAction } from "../../../lib/platform/dialog";
import {
    createWorkspaceFile as createWorkspaceFileCommand,
    deleteArchivedWorkspaceTab as deleteArchivedWorkspaceTabCommand,
    renameWorkspaceFile as renameWorkspaceFileCommand,
    restoreArchivedWorkspaceTab as restoreArchivedWorkspaceTabCommand,
} from "../../../lib/platform/workspace";
import { getErrorMessage } from "../../../lib/shared/errorMessage";
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
    serializeTabState,
    updateWorkspaceTab,
    upsertWorkspaceTab,
} from "../../../lib/workspace/session";
import type { WorkspaceSession } from "../../../types/workspace/session";
import { isMatchingWorkspacePath } from "./helpers";
import type {
    WorkspaceStoreSliceCreator,
    WorkspaceStoreUpdater,
    WorkspaceTabSlice,
} from "./types";

export const createWorkspaceTabSlice: WorkspaceStoreSliceCreator<
    WorkspaceTabSlice
> = (set, get) => {
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

                        return {
                            ...currentWorkspace,
                            activeTabId: getNextActiveTabId(
                                nextTabs,
                                currentArchivedTabIndex,
                            ),
                            archivedTabs: [
                                ...currentWorkspace.archivedTabs.filter(
                                    (tab) => tab.id !== tabId,
                                ),
                                serializeTabState(currentTabToArchive),
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

                hasSelectedTab = state.workspace.activeTabId !== tabId;

                return {
                    workspace: {
                        ...state.workspace,
                        activeTabId: tabId,
                    },
                };
            });

            if (hasSelectedTab) {
                void get().persistWorkspaceState();
            }
        },
    };
};
