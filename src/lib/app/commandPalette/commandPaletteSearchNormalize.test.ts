import { describe, expect, it } from "vite-plus/test";
import { getCommandCommandPaletteItems } from "./commandPalette";
import { normalizeAppCommandPaletteSearchValue } from "./commandPaletteSearch";
import {
    createCommandPaletteOptions,
    createWorkspaceExecutor,
    createWorkspaceSession,
} from "./commandPaletteTestUtils";

describe("normalizeAppCommandPaletteSearchValue", () => {
    it("trims and lowercases the query", () => {
        expect(normalizeAppCommandPaletteSearchValue("  Go To Line  ")).toBe(
            "go to line",
        );
    });

    it("collapses whitespace and normalizes path-like separators", () => {
        expect(
            normalizeAppCommandPaletteSearchValue(
                "  Fumi.alpha_workspace//Main-Tab  ",
            ),
        ).toBe("fumi alpha workspace main tab");
    });

    it("disables execute when no supported executor is detected", () => {
        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession: createWorkspaceSession({
                    state: {
                        workspace: {
                            workspacePath: "/workspace/current",
                            workspaceName: "current",
                            activeTabId: "tab-1",
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
                                    cursor: {
                                        line: 0,
                                        column: 0,
                                        scrollTop: 0,
                                    },
                                },
                            ],
                        },
                        activeTab: {
                            id: "tab-1",
                            fileName: "alpha.lua",
                            content: "alpha",
                            savedContent: "alpha",
                            isDirty: false,
                            cursor: { line: 0, column: 0, scrollTop: 0 },
                        },
                    },
                }),
                workspaceExecutor: createWorkspaceExecutor({
                    state: {
                        executorKind: "unsupported",
                        availablePorts: [],
                        availablePortSummaries: [],
                        hasSupportedExecutor: false,
                        port: "",
                    },
                }),
            }),
        );

        expect(
            items.find((item) => item.id === "command-execute-tab"),
        ).toMatchObject({
            isDisabled: true,
            description: "No supported executor detected.",
        });
    });
});
