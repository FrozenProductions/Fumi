import type {
    WorkspaceCursorState,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "./workspace";

export type WorkspaceTab = WorkspaceTabSnapshot & {
    savedContent: string;
};

export type WorkspaceSession = {
    workspacePath: string;
    workspaceName: string;
    activeTabId: string | null;
    tabs: WorkspaceTab[];
    archivedTabs: WorkspaceTabState[];
};

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
    archiveWorkspaceTab: (tabId: string) => Promise<void>;
    restoreArchivedWorkspaceTab: (tabId: string) => Promise<void>;
    deleteArchivedWorkspaceTab: (tabId: string) => Promise<void>;
    renameWorkspaceTab: (
        tabId: string,
        nextBaseName: string,
    ) => Promise<boolean>;
    selectWorkspaceTab: (tabId: string) => void;
    saveActiveWorkspaceTab: () => Promise<void>;
    updateActiveTabContent: (content: string) => void;
    updateActiveTabCursor: (cursor: WorkspaceCursorState) => void;
    updateActiveTabScrollTop: (scrollTop: number) => void;
};
