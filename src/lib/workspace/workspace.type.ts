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

export type ExecutorPortSummary = {
    port: number;
    boundAccountId: string | null;
    boundAccountDisplayName: string | null;
    isBoundToUnknownAccount: boolean;
};

export type ExecutorStatusPayload = {
    executorKind: ExecutorKind;
    availablePorts: readonly ExecutorPortSummary[];
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

export type WorkspacePaneId = "primary" | "secondary";

export type WorkspaceSplitView = {
    direction: "vertical";
    primaryTabId: string;
    secondaryTabId: string;
    secondaryTabIds: string[];
    splitRatio: number;
    focusedPane: WorkspacePaneId;
};

export type WorkspaceMetadata = {
    version: 2 | 3;
    activeTabId: string | null;
    splitView: WorkspaceSplitView | null;
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

export type DroppedWorkspaceScriptDraft = {
    fileName: string;
    content: string;
};

export type WorkspaceTab = WorkspaceTabSnapshot & {
    savedContent: string;
};

export type WorkspaceSession = {
    workspacePath: string;
    workspaceName: string;
    activeTabId: string | null;
    splitView: WorkspaceSplitView | null;
    tabs: WorkspaceTab[];
    archivedTabs: WorkspaceTabState[];
};
