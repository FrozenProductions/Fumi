import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_WORKSPACE_SPLIT_RATIO } from "../../../../constants/workspace/workspace";
import { buildWorkspaceSession } from "../session";
import {
    createCursor,
    createSnapshotTab,
    createTabState,
    createWorkspaceSnapshot,
} from "../sessionTestUtils";

describe("buildWorkspaceSession", () => {
    it("initializes saved content, ignores orphan metadata entries, and falls back the active tab", () => {
        const snapshot = createWorkspaceSnapshot({
            metadata: {
                version: 2,
                activeTabId: "missing-tab",
                splitView: null,
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
                executionHistory: [],
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
        expect(session.executionHistory).toEqual([]);
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

    it("normalizes split ratio when restoring a split workspace", () => {
        const snapshot = createWorkspaceSnapshot({
            metadata: {
                version: 3,
                activeTabId: "tab-2",
                splitView: {
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-2",
                    secondaryTabIds: ["tab-2"],
                    splitRatio: Number.NaN,
                    focusedPane: "secondary",
                },
                tabs: [createTabState("tab-1"), createTabState("tab-2")],
                archivedTabs: [],
                executionHistory: [],
            },
        });

        const session = buildWorkspaceSession(snapshot);

        expect(session.splitView).toEqual({
            direction: "vertical",
            primaryTabId: "tab-1",
            secondaryTabId: "tab-2",
            secondaryTabIds: ["tab-2"],
            splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
            focusedPane: "secondary",
        });
    });

    it("carries execution history from the snapshot metadata", () => {
        const snapshot = createWorkspaceSnapshot({
            metadata: {
                version: 5,
                activeTabId: "tab-1",
                splitView: null,
                tabs: [createTabState("tab-1")],
                archivedTabs: [],
                executionHistory: [
                    {
                        id: "history-1",
                        executedAt: 123,
                        executorKind: "macsploit",
                        port: 5553,
                        accountId: "account-1",
                        accountDisplayName: "Main",
                        isBoundToUnknownAccount: false,
                        fileName: "tab-1.lua",
                        scriptContent: "print('hello')",
                    },
                ],
            },
            tabs: [createSnapshotTab("tab-1")],
        });

        expect(buildWorkspaceSession(snapshot).executionHistory).toEqual(
            snapshot.metadata.executionHistory,
        );
    });
});
