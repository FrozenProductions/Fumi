import type { WorkspaceSnapshot } from "../persistence.type";
import type { WorkspaceSession } from "./session.type";
import type { WorkspaceCursorState } from "./sessionCursor.type";
import type {
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "./tabs/sessionTabs.type";

/**
 * Creates a mock cursor state for testing.
 *
 * @param overrides - Optional overrides for cursor state
 * @returns Mocked cursor state
 */
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

/**
 * Creates a mock tab snapshot for testing.
 *
 * @param id - Tab identifier
 * @param overrides - Optional overrides for tab snapshot
 * @returns Mocked tab snapshot
 */
export function createSnapshotTab(
    id: string,
    overrides: Partial<WorkspaceTabSnapshot> = {},
): WorkspaceTabSnapshot {
    return {
        id,
        fileName: `${id}.lua`,
        cursor: createCursor(),
        isPinned: false,
        content: `${id}-content`,
        isDirty: false,
        ...overrides,
    };
}

/**
 * Creates a mock tab state for testing.
 *
 * @param id - Tab identifier
 * @param overrides - Optional overrides for tab state
 * @returns Mocked tab state
 */
export function createTabState(
    id: string,
    overrides: Partial<WorkspaceTabState> = {},
): WorkspaceTabState {
    return {
        id,
        fileName: `${id}.lua`,
        cursor: createCursor(),
        isPinned: false,
        ...overrides,
    };
}

/**
 * Creates a mock workspace snapshot for testing.
 *
 * @param overrides - Optional overrides for workspace snapshot
 * @returns Mocked workspace snapshot
 */
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

/**
 * Creates a mock workspace session object for testing.
 *
 * @param overrides - Optional overrides for workspace session
 * @returns Mocked workspace session
 */
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
    const normalizedTabs = tabs.map((tab) => ({
        ...tab,
        isDirty: tab.isDirty || tab.content !== tab.savedContent,
    }));

    return {
        workspacePath: "/tmp/fumi",
        workspaceName: "fumi",
        activeTabId: normalizedTabs[0]?.id ?? null,
        splitView: null,
        archivedTabs: [],
        executionHistory: [],
        ...overrides,
        tabs: normalizedTabs,
    };
}
