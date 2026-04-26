import { describe, expect, it, vi } from "vite-plus/test";
import { getCommandCommandPaletteItems } from "../commandPalette";
import {
    createCommandPaletteOptions,
    createWorkspaceSession,
} from "../commandPaletteTestUtils";

describe("getCommandCommandPaletteItems", () => {
    it("adds an execution history command only when a workspace is open", () => {
        const onOpenExecutionHistory = vi.fn();
        const onOpenWorkspaceScreen = vi.fn();
        const withWorkspaceItems = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession: createWorkspaceSession({
                    state: {
                        workspace: {
                            workspacePath: "/workspace/current",
                            workspaceName: "current",
                            activeTabId: null,
                            splitView: null,
                            tabs: [],
                            archivedTabs: [],
                            executionHistory: [],
                        },
                    },
                }),
                onOpenExecutionHistory,
                onOpenWorkspaceScreen,
            }),
        );
        const withoutWorkspaceItems = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession: createWorkspaceSession(),
            }),
        );
        const executionHistoryItem = withWorkspaceItems.find(
            (item) => item.id === "command-open-execution-history",
        );

        expect(executionHistoryItem).toBeDefined();
        expect(
            withoutWorkspaceItems.some(
                (item) => item.id === "command-open-execution-history",
            ),
        ).toBe(false);

        executionHistoryItem?.onSelect();

        expect(onOpenWorkspaceScreen).toHaveBeenCalledOnce();
        expect(onOpenExecutionHistory).toHaveBeenCalledOnce();
    });

    it("adds split focus controls only when a split is already open", () => {
        const focusWorkspacePane = vi.fn();
        const resetWorkspaceSplitView = vi.fn();

        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession: createWorkspaceSession({
                    state: {
                        workspace: {
                            workspacePath: "/workspace/current",
                            workspaceName: "current",
                            activeTabId: "tab-1",
                            splitView: {
                                direction: "vertical",
                                primaryTabId: "tab-1",
                                secondaryTabId: "tab-2",
                                secondaryTabIds: ["tab-2"],
                                splitRatio: 0.5,
                                focusedPane: "secondary",
                            },
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
                                {
                                    id: "tab-2",
                                    fileName: "beta.lua",
                                    content: "beta",
                                    savedContent: "beta",
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
                        activeTabIndex: 0,
                    },
                    tabActions: {
                        focusWorkspacePane,
                        resetWorkspaceSplitView,
                    },
                }),
            }),
        );

        const getCommand = (id: string) =>
            items.find((item) => item.id === id) ??
            (() => {
                throw new Error(`Missing command item: ${id}`);
            })();

        expect(items.map((item) => item.id)).toEqual(
            expect.arrayContaining([
                "command-split-focus-left",
                "command-split-focus-right",
                "command-split-reset",
            ]),
        );
        expect(getCommand("command-split-focus-left")).toMatchObject({
            isDisabled: false,
            meta: "Ctrl+Mod+1",
        });
        expect(getCommand("command-split-focus-right")).toMatchObject({
            isDisabled: true,
            meta: "Current",
        });

        getCommand("command-split-focus-left").onSelect();
        getCommand("command-split-reset").onSelect();

        expect(focusWorkspacePane).toHaveBeenCalledWith("primary");
        expect(resetWorkspaceSplitView).toHaveBeenCalledOnce();
    });

    it("uses resolved hotkey labels in command metadata", () => {
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
                        activeTabIndex: 0,
                    },
                }),
                hotkeyLabels: {
                    activateGoToLine: "Mod+Shift+\\",
                    archiveWorkspaceTab: "Mod+Backspace",
                    toggleExecutorConnection: "Mod+Shift+C",
                    createWorkspaceFile: "Mod+N",
                    focusWorkspaceLeftPane: "Ctrl+Mod+1",
                    focusWorkspaceRightPane: "Ctrl+Mod+2",
                    killRoblox: "Mod+Shift+K",
                    launchRoblox: "Mod+Shift+L",
                    moveWorkspaceTabToLeftPane: "Ctrl+Mod+Left",
                    moveWorkspaceTabToRightPane: "Ctrl+Mod+Right",
                    openAccounts: "Mod+Shift+A",
                    openSettings: "Mod+Alt+,",
                    openWorkspaceDirectory: "Mod+O",
                    openWorkspaceScreen: "Mod+Shift+W",
                    openAutomaticExecution: "Mod+Shift+E",
                    openScriptLibrary: "Mod+Shift+S",
                    resetWorkspaceSplitView: "Ctrl+Mod+0",
                    toggleOutlinePanel: "Mod+Shift+O",
                    toggleSidebar: "Mod+J",
                    toggleWorkspaceSplitView: "Mod+\\",
                    toggleSidebarPosition: "",
                },
            }),
        );

        expect(
            items.find((item) => item.id === "command-settings")?.meta,
        ).toContain("Mod+Alt+,");
        expect(items.find((item) => item.id === "command-sidebar")?.meta).toBe(
            "Mod+J",
        );
        expect(
            items.find((item) => item.id === "command-toggle-split-view")?.meta,
        ).toBe("Mod+\\");
        expect(
            items.find((item) => item.id === "command-split-open-left")?.meta,
        ).toBe("Ctrl+Mod+Left");
        expect(
            items.find((item) => item.id === "command-split-open-right")?.meta,
        ).toBe("Ctrl+Mod+Right");
    });
});
