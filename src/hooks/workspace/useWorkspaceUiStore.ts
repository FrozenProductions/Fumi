import { create } from "zustand";
import type {
    WorkspaceUiStore,
    WorkspaceUiStoreState,
} from "./useWorkspaceUiStore.type";

const INITIAL_WORKSPACE_UI_STATE = {
    isTabListOpen: false,
    renamingTabId: null,
    renameValue: "",
    isRenameSubmitting: false,
    hasRenameError: false,
} satisfies WorkspaceUiStoreState;

export const useWorkspaceUiStore = create<WorkspaceUiStore>((set) => ({
    ...INITIAL_WORKSPACE_UI_STATE,
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
