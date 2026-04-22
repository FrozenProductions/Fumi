import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_WORKSPACE_SPLIT_RATIO } from "../../constants/workspace/workspace";
import { reorderWorkspaceTabs } from "./session";
import { createSnapshotTab, createWorkspaceSession } from "./sessionTestUtils";

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

    it("keeps right-pane ordering in sync with reordered tabs", () => {
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
                direction: "vertical",
                primaryTabId: "tab-1",
                secondaryTabId: "tab-3",
                secondaryTabIds: ["tab-3", "tab-4"],
                splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                focusedPane: "secondary",
            },
        });

        const nextWorkspace = reorderWorkspaceTabs(workspace, "tab-4", "tab-3");

        expect(nextWorkspace.tabs.map((tab) => tab.id)).toEqual([
            "tab-1",
            "tab-2",
            "tab-4",
            "tab-3",
        ]);
        expect(nextWorkspace.splitView?.secondaryTabIds).toEqual([
            "tab-4",
            "tab-3",
        ]);
    });
});
