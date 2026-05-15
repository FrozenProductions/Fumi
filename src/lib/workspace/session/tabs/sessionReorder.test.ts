import { describe, expect, it } from "vite-plus/test";
import {
    createSnapshotTab,
    createWorkspaceSession,
} from "../sessionTestSupport";
import { reorderWorkspaceTabs } from "./sessionTabs";

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

    it("keeps split pane tab ordering independent from tab bar order", () => {
        const workspace = createWorkspaceSession({
            tabs: [
                {
                    ...createSnapshotTab("tab-1"),
                    savedContent: "tab-1-content",
                },
                {
                    ...createSnapshotTab("tab-2"),
                    savedContent: "tab-2-content",
                },
                {
                    ...createSnapshotTab("tab-3"),
                    savedContent: "tab-3-content",
                },
                {
                    ...createSnapshotTab("tab-4"),
                    savedContent: "tab-4-content",
                },
            ],
            splitView: {
                activePaneId: "pane-secondary",
                root: {
                    type: "split",
                    id: "split-root",
                    direction: "horizontal",
                    ratios: [0.5, 0.5],
                    children: [
                        {
                            type: "pane",
                            id: "pane-primary",
                            activeTabId: "tab-1",
                            tabIds: ["tab-1", "tab-2"],
                        },
                        {
                            type: "pane",
                            id: "pane-secondary",
                            activeTabId: "tab-3",
                            tabIds: ["tab-3", "tab-4"],
                        },
                    ],
                },
            },
        });

        const nextWorkspace = reorderWorkspaceTabs(workspace, "tab-4", "tab-3");

        expect(nextWorkspace.tabs.map((tab) => tab.id)).toEqual([
            "tab-1",
            "tab-2",
            "tab-4",
            "tab-3",
        ]);
        expect(nextWorkspace.splitView?.root).toMatchObject({
            children: [
                { id: "pane-primary", tabIds: ["tab-1", "tab-2"] },
                { id: "pane-secondary", tabIds: ["tab-3", "tab-4"] },
            ],
        });
    });
});
