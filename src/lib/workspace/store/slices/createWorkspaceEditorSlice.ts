import { saveWorkspaceFile as saveWorkspaceFileCommand } from "../../../platform/workspace";
import { getErrorMessage } from "../../../shared/errorMessage";
import {
    clampCursorToContent,
    updateActiveWorkspaceTab,
    updateWorkspaceTab,
} from "../../session/session";
import type { WorkspaceCursorState } from "../../workspace.type";
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
    const getResolvedActiveTabCursor = (): WorkspaceCursorState | null => {
        const { transientTabCursorsById, workspace } = get();
        const activeTab = getActiveTabFromWorkspace(workspace);

        if (!workspace || !activeTab) {
            return null;
        }

        return clampCursorToContent(
            activeTab.content,
            transientTabCursorsById[activeTab.id] ?? activeTab.cursor,
        );
    };

    return {
        saveActiveWorkspaceTab: async (): Promise<void> => {
            const { workspace } = get();
            const activeTab = getActiveTabFromWorkspace(workspace);
            const nextCursor = getResolvedActiveTabCursor();

            if (!workspace || !activeTab || !nextCursor) {
                return;
            }

            try {
                await saveWorkspaceFileCommand({
                    workspacePath: workspace.workspacePath,
                    tabId: activeTab.id,
                    content: activeTab.content,
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
                                cursor: nextCursor,
                                savedContent: tab.content,
                            }),
                        ),
                        dirtyTabCount: Math.max(
                            0,
                            state.dirtyTabCount -
                                Number(
                                    activeTab.content !==
                                        activeTab.savedContent,
                                ),
                        ),
                        errorMessage: null,
                        transientTabCursorsById: removeTransientTabCursor(
                            state.transientTabCursorsById,
                            activeTab.id,
                        ),
                    };
                });
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

                const wasDirty = activeTab.content !== activeTab.savedContent;
                const isDirty = content !== activeTab.savedContent;

                return {
                    workspace: updateActiveWorkspaceTab(
                        currentWorkspace,
                        (tab) => ({
                            ...tab,
                            content,
                            contentRevision: (tab.contentRevision ?? 0) + 1,
                        }),
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
