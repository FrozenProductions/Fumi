export type WorkspaceUiStoreState = {
    isTabListOpen: boolean;
    renamingTabId: string | null;
    renameValue: string;
    isRenameSubmitting: boolean;
    hasRenameError: boolean;
};

export type WorkspaceUiStoreActions = {
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

export type WorkspaceUiStore = WorkspaceUiStoreState & WorkspaceUiStoreActions;
