import { describe, expect, it } from "vite-plus/test";
import { mergeWorkspaceSession } from "./session";
import {
    createCursor,
    createSnapshotTab,
    createTabState,
    createWorkspaceSession,
    createWorkspaceSnapshot,
} from "./sessionTestUtils";

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
                splitView: null,
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
                executionHistory: [],
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
        expect(merged.executionHistory).toEqual([]);
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
