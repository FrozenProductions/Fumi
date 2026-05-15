import { create } from "zustand";
import { INITIAL_WORKSPACE_UI_STATE } from "../../constants/workspace/workspace";
import type {
    WorkspaceUiStore,
    WorkspaceUiStoreState,
} from "../../lib/workspace/uiStore.type";

/**
 * Zustand store for transient workspace UI state such as tab list visibility and tab rename.
 *
 * @remarks
 * Reset when the workspace screen unmounts via `resetWorkspaceUiState`.
 * Does not persist across sessions.
 */
export const useWorkspaceUiStore = create<WorkspaceUiStore>((set) => ({
    ...(INITIAL_WORKSPACE_UI_STATE satisfies WorkspaceUiStoreState),
    openTabList: (tabListScopeId) => {
        set({ tabListScopeId });
    },
    closeTabList: (tabListScopeId) => {
        set((state) =>
            state.tabListScopeId === tabListScopeId
                ? { tabListScopeId: null }
                : {},
        );
    },
    toggleTabList: (tabListScopeId) => {
        set((state) => {
            const nextTabListScopeId =
                state.tabListScopeId === tabListScopeId ? null : tabListScopeId;

            return {
                tabListScopeId: nextTabListScopeId,
            };
        });
    },
    startTabRename: (tabId, renameValue) => {
        set({
            renamingTabId: tabId,
            renameValue,
            isRenameSubmitting: false,
            hasRenameError: false,
        });
    },
    setRenameValue: (renameValue) => {
        set({ renameValue });
    },
    setRenameSubmitting: (isRenameSubmitting) => {
        set({ isRenameSubmitting });
    },
    setRenameError: (hasRenameError) => {
        set({ hasRenameError });
    },
    resetRenameState: () => {
        set({
            renamingTabId: null,
            renameValue: "",
            isRenameSubmitting: false,
            hasRenameError: false,
        });
    },
    resetWorkspaceUiState: () => {
        set(INITIAL_WORKSPACE_UI_STATE);
    },
}));
