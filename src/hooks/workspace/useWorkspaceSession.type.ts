import type {
    WorkspaceCursorState,
    WorkspaceSession,
    WorkspaceTab,
} from "../../lib/workspace/workspace.type";

export type UseWorkspaceSessionResult = {
    isBootstrapping: boolean;
    workspace: WorkspaceSession | null;
    activeTab: WorkspaceTab | null;
    activeTabIndex: number;
    recentWorkspacePaths: string[];
    errorMessage: string | null;
    hasUnsavedChanges: boolean;
    openWorkspaceDirectory: () => Promise<void>;
    openWorkspacePath: (workspacePath: string) => Promise<void>;
    createWorkspaceFile: () => Promise<void>;
    addWorkspaceScriptTab: (
        fileName: string,
        content: string,
    ) => Promise<boolean>;
    duplicateWorkspaceTab: (tabId: string) => Promise<void>;
    archiveWorkspaceTab: (tabId: string) => Promise<void>;
    deleteWorkspaceTab: (tabId: string) => Promise<void>;
    restoreArchivedWorkspaceTab: (tabId: string) => Promise<void>;
    restoreAllArchivedWorkspaceTabs: () => Promise<void>;
    deleteArchivedWorkspaceTab: (tabId: string) => Promise<void>;
    deleteAllArchivedWorkspaceTabs: () => Promise<void>;
    renameWorkspaceTab: (
        tabId: string,
        nextBaseName: string,
    ) => Promise<boolean>;
    selectWorkspaceTab: (tabId: string) => void;
    reorderWorkspaceTab: (draggedTabId: string, targetTabId: string) => void;
    saveActiveWorkspaceTab: () => Promise<void>;
    updateActiveTabContent: (content: string) => void;
    updateActiveTabCursor: (cursor: WorkspaceCursorState) => void;
    updateActiveTabScrollTop: (scrollTop: number) => void;
};
