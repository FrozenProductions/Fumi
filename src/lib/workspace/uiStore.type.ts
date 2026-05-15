export type WorkspaceUiStoreState = {
    tabListScopeId: string | null;
    renamingTabId: string | null;
    renameValue: string;
    isRenameSubmitting: boolean;
    hasRenameError: boolean;
};

type WorkspaceUiStoreActions = {
    openTabList: (tabListScopeId: string) => void;
    closeTabList: (tabListScopeId: string) => void;
    toggleTabList: (tabListScopeId: string) => void;
    startTabRename: (tabId: string, renameValue: string) => void;
    setRenameValue: (renameValue: string) => void;
    setRenameSubmitting: (isRenameSubmitting: boolean) => void;
    setRenameError: (hasRenameError: boolean) => void;
    resetRenameState: () => void;
    resetWorkspaceUiState: () => void;
};

export type WorkspaceUiStore = WorkspaceUiStoreState & WorkspaceUiStoreActions;
