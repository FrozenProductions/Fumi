import { saveWorkspaceFile as saveWorkspaceFileCommand } from "../../../platform/workspace/workspace";
import { getErrorMessage } from "../../../shared/errorMessage";
import {
    clearLiveWorkspaceEditorContent,
    getLiveWorkspaceEditorContent,
} from "../../editor/liveWorkspaceEditorContent";
import { clampCursorToContent } from "../../session/sessionCursor";
import type { WorkspaceCursorState } from "../../session/sessionCursor.type";
import {
    updateActiveWorkspaceTab,
    updateWorkspaceTab,
} from "../../session/tabs/sessionTabs";
import type { WorkspaceTab } from "../../session/tabs/sessionTabs.type";
import {
    getActiveTabFromWorkspace,
    isMatchingWorkspacePath,
} from "../workspaceNavigation";
import type {
    WorkspaceEditorSlice,
    WorkspaceStoreSliceCreator,
} from "../workspaceStore.type";

function removeTransientTabCursor(
    transientTabCursorsById: Record<string, WorkspaceCursorState>,
    tabId: string,
): Record<string, WorkspaceCursorState> {
    if (!(tabId in transientTabCursorsById)) {
        return transientTabCursorsById;
    }

    return Object.fromEntries(
        Object.entries(transientTabCursorsById).filter(
            ([currentTabId]) => currentTabId !== tabId,
        ),
    );
}

/** Creates the workspace store slice responsible for saving, editing, and cursor state of the active tab. */
export const createWorkspaceEditorSlice: WorkspaceStoreSliceCreator<
    WorkspaceEditorSlice
> = (set, get) => {
    const updateTabContent = (
        tab: WorkspaceTab,
        content: string,
    ): WorkspaceTab => ({
        ...tab,
        content,
        isDirty: content !== tab.savedContent,
        contentRevision: (tab.contentRevision ?? 0) + 1,
    });
    return {
        saveActiveWorkspaceTab: async (): Promise<void> => {
            const { transientTabCursorsById, workspace } = get();
            const activeTab = getActiveTabFromWorkspace(workspace);
            const activeContent = activeTab
                ? (getLiveWorkspaceEditorContent(activeTab.id) ??
                  activeTab.content)
                : null;
            const nextCursor =
                activeTab && activeContent !== null
                    ? clampCursorToContent(
                          activeContent,
                          transientTabCursorsById[activeTab.id] ??
                              activeTab.cursor,
                      )
                    : null;

            if (
                !workspace ||
                !activeTab ||
                activeContent === null ||
                !nextCursor
            ) {
                return;
            }

            try {
                await saveWorkspaceFileCommand({
                    workspacePath: workspace.workspacePath,
                    tabId: activeTab.id,
                    content: activeContent,
                    cursor: nextCursor,
                });

                set((state) => {
                    if (
                        !isMatchingWorkspacePath(
                            state.workspace,
                            workspace.workspacePath,
                        )
                    ) {
                        return {};
                    }

                    const currentWorkspace = state.workspace;

                    if (!currentWorkspace) {
                        return {};
                    }

                    return {
                        workspace: updateWorkspaceTab(
                            currentWorkspace,
                            activeTab.id,
                            (tab) => ({
                                ...tab,
                                content: activeContent,
                                cursor: nextCursor,
                                isDirty: false,
                                savedContent: activeContent,
                            }),
                        ),
                        dirtyTabCount: Math.max(
                            0,
                            state.dirtyTabCount - Number(activeTab.isDirty),
                        ),
                        errorMessage: null,
                        transientTabCursorsById: removeTransientTabCursor(
                            state.transientTabCursorsById,
                            activeTab.id,
                        ),
                    };
                });
                clearLiveWorkspaceEditorContent(activeTab.id);
            } catch (error) {
                console.error("Failed to save workspace file.", error);
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not save the active file.",
                    ),
                });
            }
        },
        updateActiveTabContent: (content: string): void => {
            set((state) => {
                const currentWorkspace = state.workspace;

                if (!currentWorkspace) {
                    return {
                        workspace: currentWorkspace,
                    };
                }

                const activeTab = getActiveTabFromWorkspace(currentWorkspace);

                if (!activeTab || activeTab.content === content) {
                    return {
                        workspace: currentWorkspace,
                    };
                }

                const wasDirty = activeTab.isDirty;
                const isDirty = content !== activeTab.savedContent;

                return {
                    workspace: updateActiveWorkspaceTab(
                        currentWorkspace,
                        (tab) => updateTabContent(tab, content),
                    ),
                    dirtyTabCount:
                        state.dirtyTabCount +
                        Number(isDirty) -
                        Number(wasDirty),
                };
            });
        },
        updateWorkspaceTabContent: (tabId: string, content: string): void => {
            set((state) => {
                const currentWorkspace = state.workspace;

                if (!currentWorkspace) {
                    return {};
                }

                const targetTab = currentWorkspace.tabs.find(
                    (tab) => tab.id === tabId,
                );

                if (!targetTab || targetTab.content === content) {
                    return {};
                }

                const wasDirty = targetTab.isDirty;
                const isDirty = content !== targetTab.savedContent;

                return {
                    workspace: updateWorkspaceTab(
                        currentWorkspace,
                        tabId,
                        (tab) => updateTabContent(tab, content),
                    ),
                    dirtyTabCount:
                        state.dirtyTabCount +
                        Number(isDirty) -
                        Number(wasDirty),
                };
            });
        },
        updateActiveTabCursor: (cursor: WorkspaceCursorState): void => {
            set((state) => {
                const activeTab = getActiveTabFromWorkspace(state.workspace);

                if (!activeTab) {
                    return {};
                }

                const nextCursor = clampCursorToContent(
                    activeTab.content,
                    cursor,
                );
                const currentCursor =
                    state.transientTabCursorsById[activeTab.id] ??
                    activeTab.cursor;

                if (
                    currentCursor.line === nextCursor.line &&
                    currentCursor.column === nextCursor.column &&
                    currentCursor.scrollTop === nextCursor.scrollTop
                ) {
                    return {};
                }

                return {
                    transientTabCursorsById: {
                        ...state.transientTabCursorsById,
                        [activeTab.id]: nextCursor,
                    },
                    persistRevision: state.persistRevision + 1,
                };
            });
        },
        updateActiveTabScrollTop: (scrollTop: number): void => {
            set((state) => {
                const activeTab = getActiveTabFromWorkspace(state.workspace);

                if (!activeTab) {
                    return {};
                }

                const baseCursor =
                    state.transientTabCursorsById[activeTab.id] ??
                    activeTab.cursor;
                const nextCursor = clampCursorToContent(activeTab.content, {
                    ...baseCursor,
                    scrollTop: Math.max(scrollTop, 0),
                });

                if (baseCursor.scrollTop === nextCursor.scrollTop) {
                    return {};
                }

                return {
                    transientTabCursorsById: {
                        ...state.transientTabCursorsById,
                        [activeTab.id]: nextCursor,
                    },
                    persistRevision: state.persistRevision + 1,
                };
            });
        },
        setErrorMessage: (errorMessage: string | null): void => {
            set({ errorMessage });
        },
        clearErrorMessage: (): void => {
            set({ errorMessage: null });
        },
    };
};
