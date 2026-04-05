export type ArchivedTabsSortOption =
    | "dateDesc"
    | "dateAsc"
    | "nameAsc"
    | "nameDesc";

export type ExecutorMessageType = "print" | "error";

export type ExecutorMessagePayload = {
    message: string;
    messageType: ExecutorMessageType;
};

export type ExecutorStatusPayload = {
    port: number;
    isAttached: boolean;
};

export type WorkspaceFileNameParts = {
    baseName: string;
    extension: string;
};

export type WorkspaceCursorState = {
    line: number;
    column: number;
    scrollTop: number;
};

export type WorkspaceTabState = {
    id: string;
    fileName: string;
    cursor: WorkspaceCursorState;
    archivedAt?: number;
};

export type WorkspaceTabSnapshot = WorkspaceTabState & {
    content: string;
    isDirty: boolean;
};

export type WorkspaceMetadata = {
    version: 2;
    activeTabId: string | null;
    tabs: WorkspaceTabState[];
    archivedTabs: WorkspaceTabState[];
};

export type WorkspaceSnapshot = {
    workspacePath: string;
    workspaceName: string;
    metadata: WorkspaceMetadata;
    tabs: WorkspaceTabSnapshot[];
};

export type WorkspaceBootstrapResponse = {
    lastWorkspacePath: string | null;
    workspace: WorkspaceSnapshot | null;
};

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
