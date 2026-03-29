import { create } from "zustand";

type WorkspaceUiStoreState = {
    isTabListOpen: boolean;
    renamingTabId: string | null;
    renameValue: string;
    isRenameSubmitting: boolean;
    hasRenameError: boolean;
};

type WorkspaceUiStoreActions = {
    openTabList: () => void;
    closeTabList: () => void;
    toggleTabList: () => void;
    startTabRename: (tabId: string, renameValue: string) => void;
    setRenameValue: (renameValue: string) => void;
    setRenameSubmitting: (isRenameSubmitting: boolean) => void;
    setRenameError: (hasRenameError: boolean) => void;
    resetRenameState: () => void;
    resetWorkspaceUiState: () => void;
};

type WorkspaceUiStore = WorkspaceUiStoreState & WorkspaceUiStoreActions;

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
