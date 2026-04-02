import { describe, expect, it } from "vite-plus/test";
import type {
    WorkspaceCursorState,
    WorkspaceSession,
    WorkspaceSnapshot,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../../lib/workspace/workspace.type";
import {
    buildWorkspaceSession,
    clampCursorToContent,
    getNextActiveTabId,
    hasWorkspaceDraftChanges,
    mergeWorkspaceSession,
    reorderWorkspaceTabs,
} from "./session";

function createCursor(
    overrides: Partial<WorkspaceCursorState> = {},
): WorkspaceCursorState {
    return {
        line: 0,
        column: 0,
        scrollTop: 0,
        ...overrides,
    };
}

function createSnapshotTab(
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

function createTabState(
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

function createWorkspaceSnapshot(
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
            tabs: tabs.map((tab) =>
                createTabState(tab.id, {
                    fileName: tab.fileName,
                    cursor: tab.cursor,
                }),
            ),
            archivedTabs: [],
            ...overrides.metadata,
        },
        tabs,
        ...overrides,
    };
}

function createWorkspaceSession(
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
        tabs,
        archivedTabs: [],
        ...overrides,
    };
}

describe("clampCursorToContent", () => {
    it("clamps the line, column, and scroll position to valid content bounds", () => {
        expect(
            clampCursorToContent("abc\nde", {
                line: 10,
                column: 20,
                scrollTop: -8,
            }),
        ).toEqual({
            line: 1,
            column: 2,
            scrollTop: 0,
        });
    });
});

describe("buildWorkspaceSession", () => {
    it("initializes saved content, ignores orphan metadata entries, and falls back the active tab", () => {
        const snapshot = createWorkspaceSnapshot({
            metadata: {
                version: 2,
                activeTabId: "missing-tab",
                tabs: [
                    createTabState("tab-2", {
                        fileName: "renamed.lua",
                        cursor: createCursor({
                            line: 0,
                            column: 4,
                            scrollTop: 6,
                        }),
                    }),
                    createTabState("orphan-tab"),
                ],
                archivedTabs: [createTabState("archived-tab")],
            },
            tabs: [
                createSnapshotTab("tab-1"),
                createSnapshotTab("tab-2", {
                    fileName: "renamed.lua",
                    content: "name",
                }),
            ],
        });

        const session = buildWorkspaceSession(snapshot);

        expect(session.activeTabId).toBe("tab-2");
        expect(session.archivedTabs).toEqual([createTabState("archived-tab")]);
        expect(session.tabs).toHaveLength(1);
        expect(session.tabs[0]).toMatchObject({
            id: "tab-2",
            fileName: "renamed.lua",
            content: "name",
            savedContent: "name",
            cursor: {
                line: 0,
                column: 4,
                scrollTop: 6,
            },
        });
    });
});

describe("getNextActiveTabId", () => {
    it("selects the next tab when one exists and otherwise falls back to the previous tab", () => {
        const tabs = createWorkspaceSession().tabs;

        expect(getNextActiveTabId([tabs[1]], 0)).toBe("tab-2");
        expect(getNextActiveTabId([tabs[0]], 1)).toBe("tab-1");
        expect(getNextActiveTabId([], 0)).toBeNull();
    });
});

describe("hasWorkspaceDraftChanges", () => {
    it("returns true only when a tab content differs from saved content", () => {
        expect(hasWorkspaceDraftChanges(createWorkspaceSession())).toBe(false);
        expect(
            hasWorkspaceDraftChanges(
                createWorkspaceSession({
                    tabs: [
                        {
                            ...createSnapshotTab("tab-1", {
                                content: "dirty",
                            }),
                            savedContent: "saved",
                        },
                    ],
                }),
            ),
        ).toBe(true);
    });
});

describe("reorderWorkspaceTabs", () => {
    it("returns the current workspace for invalid or self-targeted reorder requests", () => {
        const workspace = createWorkspaceSession();

        expect(reorderWorkspaceTabs(workspace, "tab-1", "tab-1")).toBe(
            workspace,
        );
        expect(reorderWorkspaceTabs(workspace, "missing", "tab-2")).toBe(
            workspace,
        );
        expect(reorderWorkspaceTabs(workspace, "tab-1", "missing")).toBe(
            workspace,
        );
    });

    it("moves a dragged tab to the target position", () => {
        const workspace = createWorkspaceSession();

        const nextWorkspace = reorderWorkspaceTabs(workspace, "tab-1", "tab-2");

        expect(nextWorkspace.tabs.map((tab) => tab.id)).toEqual([
            "tab-2",
            "tab-1",
        ]);
    });
});

describe("mergeWorkspaceSession", () => {
    it("refreshes clean tabs, preserves dirty local tabs, and resolves the next active tab", () => {
        const currentWorkspace = createWorkspaceSession({
            activeTabId: "tab-dirty",
            tabs: [
                {
                    ...createSnapshotTab("tab-clean", {
                        fileName: "clean.lua",
                        content: "old clean",
                        cursor: createCursor({
                            line: 1,
                            column: 4,
                            scrollTop: 10,
                        }),
                    }),
                    savedContent: "old clean",
                },
                {
                    ...createSnapshotTab("tab-dirty", {
                        fileName: "dirty.lua",
                        content: "draft",
                        cursor: createCursor({
                            line: 9,
                            column: 9,
                            scrollTop: -3,
                        }),
                    }),
                    savedContent: "saved",
                },
            ],
        });
        const snapshot = createWorkspaceSnapshot({
            workspacePath: "/tmp/next",
            workspaceName: "next",
            metadata: {
                version: 2,
                activeTabId: "missing-active",
                tabs: [
                    createTabState("tab-clean", {
                        fileName: "clean-renamed.lua",
                        cursor: createCursor({
                            line: 5,
                            column: 20,
                            scrollTop: 12,
                        }),
                    }),
                    createTabState("tab-fresh", {
                        fileName: "fresh.lua",
                        cursor: createCursor({
                            line: 0,
                            column: 50,
                            scrollTop: 3,
                        }),
                    }),
                ],
                archivedTabs: [createTabState("archived-tab")],
            },
            tabs: [
                createSnapshotTab("tab-clean", {
                    fileName: "clean-renamed.lua",
                    content: "new",
                }),
                createSnapshotTab("tab-fresh", {
                    fileName: "fresh.lua",
                    content: "fresh",
                }),
            ],
        });

        const merged = mergeWorkspaceSession(currentWorkspace, snapshot);

        expect(merged.workspacePath).toBe("/tmp/next");
        expect(merged.workspaceName).toBe("next");
        expect(merged.activeTabId).toBe("tab-dirty");
        expect(merged.archivedTabs).toEqual([createTabState("archived-tab")]);
        expect(merged.tabs.map((tab) => tab.id)).toEqual([
            "tab-clean",
            "tab-fresh",
            "tab-dirty",
        ]);
        expect(merged.tabs[0]).toMatchObject({
            id: "tab-clean",
            fileName: "clean-renamed.lua",
            content: "new",
            savedContent: "new",
            cursor: {
                line: 0,
                column: 3,
                scrollTop: 12,
            },
        });
        expect(merged.tabs[1]).toMatchObject({
            id: "tab-fresh",
            fileName: "fresh.lua",
            content: "fresh",
            savedContent: "fresh",
            cursor: {
                line: 0,
                column: 5,
                scrollTop: 3,
            },
        });
        expect(merged.tabs[2]).toMatchObject({
            id: "tab-dirty",
            fileName: "dirty.lua",
            content: "draft",
            savedContent: "saved",
            cursor: {
                line: 0,
                column: 5,
                scrollTop: 0,
            },
        });
    });
});
