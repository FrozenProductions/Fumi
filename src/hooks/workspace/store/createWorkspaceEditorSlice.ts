import { saveWorkspaceFile as saveWorkspaceFileCommand } from "../../../lib/platform/workspace";
import { getErrorMessage } from "../../../lib/shared/errorMessage";
import {
    clampCursorToContent,
    updateActiveWorkspaceTab,
    updateWorkspaceTab,
} from "../../../lib/workspace/session";
import type { WorkspaceCursorState } from "../../../lib/workspace/workspace.type";
import { getActiveTabFromWorkspace, isMatchingWorkspacePath } from "./helpers";
import type {
    WorkspaceEditorSlice,
    WorkspaceStoreSliceCreator,
} from "./workspaceStore.type";

export const createWorkspaceEditorSlice: WorkspaceStoreSliceCreator<
    WorkspaceEditorSlice
> = (set, get) => ({
    saveActiveWorkspaceTab: async (): Promise<void> => {
        const { workspace } = get();
        const activeTab = getActiveTabFromWorkspace(workspace);

        if (!workspace || !activeTab) {
            return;
        }

        try {
            await saveWorkspaceFileCommand({
                workspacePath: workspace.workspacePath,
                tabId: activeTab.id,
                content: activeTab.content,
                cursor: activeTab.cursor,
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
                            savedContent: tab.content,
                        }),
                    ),
                    errorMessage: null,
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
        set((state) => ({
            workspace: state.workspace
                ? updateActiveWorkspaceTab(state.workspace, (tab) => ({
                      ...tab,
                      content,
                  }))
                : state.workspace,
        }));
    },
    updateActiveTabCursor: (cursor: WorkspaceCursorState): void => {
        set((state) => {
            if (!state.workspace) {
                return {
                    workspace: state.workspace,
                };
            }

            const nextWorkspace = updateActiveWorkspaceTab(
                state.workspace,
                (tab) => ({
                    ...tab,
                    cursor: clampCursorToContent(tab.content, cursor),
                }),
            );

            if (nextWorkspace === state.workspace) {
                return {
                    workspace: state.workspace,
                };
            }

            return {
                workspace: nextWorkspace,
                persistRevision: state.persistRevision + 1,
            };
        });
    },
    updateActiveTabScrollTop: (scrollTop: number): void => {
        set((state) => {
            if (!state.workspace) {
                return {
                    workspace: state.workspace,
                };
            }

            const nextWorkspace = updateActiveWorkspaceTab(
                state.workspace,
                (tab) => ({
                    ...tab,
                    cursor: {
                        ...tab.cursor,
                        scrollTop: Math.max(scrollTop, 0),
                    },
                }),
            );

            if (nextWorkspace === state.workspace) {
                return {
                    workspace: state.workspace,
                };
            }

            return {
                workspace: nextWorkspace,
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
});
