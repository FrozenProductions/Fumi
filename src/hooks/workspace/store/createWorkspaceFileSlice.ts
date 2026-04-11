import { MAX_WORKSPACE_TAB_NAME_LENGTH } from "../../../constants/workspace/workspace";
import { confirmAction } from "../../../lib/platform/dialog";
import {
    createWorkspaceFile as createWorkspaceFileCommand,
    deleteWorkspaceFile as deleteWorkspaceFileCommand,
    renameWorkspaceFile as renameWorkspaceFileCommand,
} from "../../../lib/platform/workspace";
import { buildDuplicateWorkspaceTabDraft } from "../../../lib/workspace/duplicate";
import {
    buildWorkspaceFileName,
    clampWorkspaceTabBaseName,
    isWorkspaceTabBaseNameTooLong,
    splitWorkspaceFileName,
} from "../../../lib/workspace/fileName";
import {
    getNextActiveTabId,
    removedTabFromSplitView,
    updateWorkspaceTab,
    upsertWorkspaceTab,
} from "../../../lib/workspace/session";
import { createWorkspaceStoreSupport } from "./createWorkspaceStoreSupport";
import type {
    WorkspaceFileSlice,
    WorkspaceStoreSliceCreator,
} from "./workspaceStore.type";

export const createWorkspaceFileSlice: WorkspaceStoreSliceCreator<
    WorkspaceFileSlice
> = (set, get) => {
    const {
        markNextWorkspaceAsPersisted,
        setWorkspaceError,
        updateWorkspaceForPath,
    } = createWorkspaceStoreSupport(set, get);

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
                setWorkspaceError(
                    error,
                    "Failed to create workspace file.",
                    "Could not create a new workspace file.",
                );
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
                setWorkspaceError(
                    error,
                    "Failed to add script to workspace.",
                    "Could not add the script to the current workspace.",
                );
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
                setWorkspaceError(
                    error,
                    "Failed to duplicate workspace tab.",
                    "Could not duplicate the selected tab.",
                );
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
                setWorkspaceError(
                    error,
                    "Failed to delete workspace tab.",
                    "Could not delete the selected tab.",
                );
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
                setWorkspaceError(
                    error,
                    "Failed to rename workspace file.",
                    "Could not rename the selected file.",
                );
                return false;
            }
        },
    };
};
