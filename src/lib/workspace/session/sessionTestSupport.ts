import type {
    WorkspaceCursorState,
    WorkspaceSession,
    WorkspaceSnapshot,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../workspace.type";

export function createCursor(
    overrides: Partial<WorkspaceCursorState> = {},
): WorkspaceCursorState {
    return {
        line: 0,
        column: 0,
        scrollTop: 0,
        ...overrides,
    };
}

export function createSnapshotTab(
    id: string,
    overrides: Partial<WorkspaceTabSnapshot> = {},
): WorkspaceTabSnapshot {
    return {
        id,
        fileName: `${id}.lua`,
        cursor: createCursor(),
        content: `${id}-content`,
        isDirty: false,
        ...overrides,
    };
}

export function createTabState(
    id: string,
    overrides: Partial<WorkspaceTabState> = {},
): WorkspaceTabState {
    return {
        id,
        fileName: `${id}.lua`,
        cursor: createCursor(),
        ...overrides,
    };
}

export function createWorkspaceSnapshot(
    overrides: Partial<WorkspaceSnapshot> = {},
): WorkspaceSnapshot {
    const tabs = overrides.tabs ?? [
        createSnapshotTab("tab-1"),
        createSnapshotTab("tab-2"),
    ];

    return {
        workspacePath: "/tmp/fumi",
        workspaceName: "fumi",
        metadata: {
            version: 2,
            activeTabId: tabs[0]?.id ?? null,
            splitView: null,
            tabs: tabs.map((tab) =>
                createTabState(tab.id, {
                    fileName: tab.fileName,
                    cursor: tab.cursor,
                }),
            ),
            archivedTabs: [],
            executionHistory: [],
            ...overrides.metadata,
        },
        tabs,
        ...overrides,
    };
}

export function createWorkspaceSession(
    overrides: Partial<WorkspaceSession> = {},
): WorkspaceSession {
    const tabs = overrides.tabs ?? [
        {
            ...createSnapshotTab("tab-1"),
            savedContent: "tab-1-content",
        },
        {
            ...createSnapshotTab("tab-2"),
            savedContent: "tab-2-content",
        },
    ];

    return {
        workspacePath: "/tmp/fumi",
        workspaceName: "fumi",
        activeTabId: tabs[0]?.id ?? null,
        splitView: null,
        tabs,
        archivedTabs: [],
        executionHistory: [],
        ...overrides,
    };
}
