export type ArchivedTabsSortOption =
    | "dateDesc"
    | "dateAsc"
    | "nameAsc"
    | "nameDesc";

export type ExecutorMessageType = "print" | "error";

export type ExecutorKind = "macsploit" | "opiumware" | "unsupported";

export type ExecutorMessagePayload = {
    message: string;
    messageType: ExecutorMessageType;
};

export type ExecutorStatusPayload = {
    executorKind: ExecutorKind;
    availablePorts: readonly number[];
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
