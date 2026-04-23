import { create } from "zustand";
import { INITIAL_WORKSPACE_UI_STATE } from "../../constants/workspace/workspace";
import type {
    WorkspaceUiStore,
    WorkspaceUiStoreState,
} from "../../lib/workspace/uiStore.type";

export const useWorkspaceUiStore = create<WorkspaceUiStore>((set) => ({
    ...(INITIAL_WORKSPACE_UI_STATE satisfies WorkspaceUiStoreState),
    openTabList: () => {
        set({ isTabListOpen: true });
    },
    closeTabList: () => {
        set({ isTabListOpen: false });
    },
    toggleTabList: () => {
        set((state) => ({ isTabListOpen: !state.isTabListOpen }));
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
