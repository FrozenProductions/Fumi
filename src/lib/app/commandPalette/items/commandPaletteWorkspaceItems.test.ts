import { describe, expect, it, vi } from "vite-plus/test";
import { getWorkspaceCommandPaletteItems } from "../commandPalette";
import { createWorkspaceSession } from "../commandPaletteTestUtils";

describe("getWorkspaceCommandPaletteItems", () => {
    it("excludes the current workspace from recent workspace results", () => {
        const openWorkspacePath = vi.fn().mockResolvedValue(undefined);
        const workspaceSession = createWorkspaceSession({
            state: {
                workspace: {
                    workspacePath: "/Users/dayte/projects/current",
                    workspaceName: "current",
                    activeTabId: null,
                    splitView: null,
                    tabs: [],
                    archivedTabs: [
                        {
                            id: "archived-1",
                            fileName: "old.lua",
                            cursor: { line: 0, column: 0, scrollTop: 0 },
                        },
                    ],
                    executionHistory: [],
                },
                recentWorkspacePaths: [
                    "/Users/dayte/projects/current",
                    "/Users/dayte/projects/other",
                    "/Users/dayte/projects/archive",
                ],
            },
            workspaceActions: {
                openWorkspacePath,
            },
        });

        const items = getWorkspaceCommandPaletteItems(workspaceSession);

        expect(items.map((item) => item.id)).toEqual([
            "workspace-folder",
            "workspace-recent-/Users/dayte/projects/other",
            "workspace-recent-/Users/dayte/projects/archive",
        ]);
        expect(items[0]).toMatchObject({
            label: "current",
            description: "0 tabs • 1 archived",
            meta: "~/projects/current",
        });

        items[1]?.onSelect();

        expect(openWorkspacePath).toHaveBeenCalledWith(
            "/Users/dayte/projects/other",
        );
    });
});
