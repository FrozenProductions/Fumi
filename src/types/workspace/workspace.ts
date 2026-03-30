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
