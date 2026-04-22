import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { describe, expect, it, vi } from "vite-plus/test";
import { getTabCommandPaletteItems } from "./commandPalette";
import { createWorkspaceSession } from "./commandPaletteTestUtils";

describe("getTabCommandPaletteItems", () => {
    it("returns a workspace fallback item when no workspace is open", async () => {
        const workspaceSession = createWorkspaceSession();

        const items = getTabCommandPaletteItems(workspaceSession);

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            id: "tab-open-workspace",
            label: "Choose workspace",
            icon: FolderOpenIcon,
        });

        items[0].onSelect();

        expect(
            workspaceSession.workspaceActions.openWorkspaceDirectory,
        ).toHaveBeenCalledOnce();
    });

    it("returns tab items with active-tab keywords and selection handlers", () => {
        const selectWorkspaceTab = vi.fn();
        const workspaceSession = createWorkspaceSession({
            state: {
                workspace: {
                    workspacePath: "/workspace/current",
                    workspaceName: "current",
                    activeTabId: "tab-2",
                    splitView: null,
                    archivedTabs: [],
                    executionHistory: [],
                    tabs: [
                        {
                            id: "tab-1",
                            fileName: "alpha.lua",
                            content: "alpha",
                            savedContent: "alpha",
                            isDirty: false,
                            cursor: { line: 0, column: 0, scrollTop: 0 },
                        },
                        {
                            id: "tab-2",
                            fileName: "beta.lua",
                            content: "beta",
                            savedContent: "beta",
                            isDirty: false,
                            cursor: { line: 0, column: 0, scrollTop: 0 },
                        },
                    ],
                },
                activeTab: {
                    id: "tab-2",
                    fileName: "beta.lua",
                    content: "beta",
                    savedContent: "beta",
                    isDirty: false,
                    cursor: { line: 0, column: 0, scrollTop: 0 },
                },
                activeTabIndex: 1,
            },
            tabActions: {
                selectWorkspaceTab,
            },
        });

        const items = getTabCommandPaletteItems(workspaceSession);

        expect(items.map((item) => item.label)).toEqual(["alpha", "beta"]);
        expect(items[1]?.keywords).toContain("active current selected");

        items[0]?.onSelect();

        expect(selectWorkspaceTab).toHaveBeenCalledWith("tab-1");
    });
});
