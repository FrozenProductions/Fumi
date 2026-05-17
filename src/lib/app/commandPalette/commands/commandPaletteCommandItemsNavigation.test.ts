import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { getAppCommandPaletteResults } from "../commandPaletteController";
import { getAttachCommandPaletteItems } from "../commandPaletteModes";
import {
    createCommandPaletteOptions,
    createWorkspaceExecutor,
    createWorkspaceSession,
} from "../commandPaletteTestSupport";
import { getCommandCommandPaletteItems } from "./commandPaletteCommands";

const platformMocks = vi.hoisted(() => ({
    confirmAction: vi.fn().mockResolvedValue(true),
    formatLuauScript: vi.fn().mockResolvedValue({ formatted: "formatted" }),
    isTauriEnvironment: vi.fn(() => true),
    killRobloxProcesses: vi.fn().mockResolvedValue(undefined),
    launchRoblox: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../platform/roblox/accounts", () => ({
    killRobloxProcesses: platformMocks.killRobloxProcesses,
    launchRoblox: platformMocks.launchRoblox,
}));

vi.mock("../../../platform/core/dialog", () => ({
    confirmAction: platformMocks.confirmAction,
}));

vi.mock("../../../platform/core/luau", () => ({
    formatLuauScript: platformMocks.formatLuauScript,
}));

vi.mock("../../../platform/core/runtime", () => ({
    isTauriEnvironment: platformMocks.isTauriEnvironment,
}));

beforeEach(() => {
    platformMocks.confirmAction.mockReset();
    platformMocks.confirmAction.mockResolvedValue(true);
    platformMocks.formatLuauScript.mockReset();
    platformMocks.formatLuauScript.mockResolvedValue({
        formatted: "formatted",
    });
    platformMocks.isTauriEnvironment.mockReset();
    platformMocks.isTauriEnvironment.mockReturnValue(true);
    platformMocks.killRobloxProcesses.mockReset();
    platformMocks.killRobloxProcesses.mockResolvedValue(undefined);
    platformMocks.launchRoblox.mockReset();
    platformMocks.launchRoblox.mockResolvedValue(undefined);
});

describe("getCommandCommandPaletteItems", () => {
    it("includes navigation, zoom, theme, and workspace commands without an active tab", () => {
        platformMocks.isTauriEnvironment.mockReturnValue(true);

        const noWorkspaceItems = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession: createWorkspaceSession(),
                activeSidebarItem: "workspace",
            }),
        );

        expect(noWorkspaceItems.map((item) => item.id)).toEqual(
            expect.arrayContaining([
                "command-open-workspace-screen",
                "command-open-automatic-execution",
                "command-open-script-library",
                "command-open-accounts",
                "command-settings",
                "command-open-workspace-folder",
                "command-attach-executor",
                "command-detach-executor",
                "command-launch-roblox",
                "command-kill-roblox",
                "command-sidebar",
                "command-outline-panel",
                "command-zoom-in",
                "command-zoom-out",
                "command-zoom-reset",
                "command-change-theme",
            ]),
        );

        expect(
            noWorkspaceItems.find(
                (item) => item.id === "command-open-workspace-screen",
            ),
        ).toMatchObject({
            isDisabled: true,
            meta: "Current",
        });
        expect(
            noWorkspaceItems.find((item) => item.id === "command-change-theme"),
        ).toMatchObject({
            closeOnSelect: false,
        });
        expect(
            noWorkspaceItems.some((item) => item.id === "command-execute-tab"),
        ).toBe(false);
    });

    it("builds actionable tab commands without coupling the test to the full command inventory", () => {
        const executeActiveTab = vi.fn().mockResolvedValue(undefined);
        const duplicateWorkspaceTab = vi.fn().mockResolvedValue(undefined);
        const deleteWorkspaceTab = vi.fn().mockResolvedValue(undefined);
        const toggleConnection = vi.fn().mockResolvedValue(undefined);
        const splitWorkspaceTab = vi.fn();
        const onActivateAttachMode = vi.fn();
        const onActivateGoToLineMode = vi.fn();
        const onActivateThemeMode = vi.fn();
        const onOpenWorkspaceScreen = vi.fn();
        const onOpenAccounts = vi.fn();
        const onOpenExecutionHistory = vi.fn();
        const onOpenSettings = vi.fn();
        const onRequestRenameCurrentTab = vi.fn();

        const workspaceSession = createWorkspaceSession({
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
                            cursor: { line: 0, column: 0, scrollTop: 0 },
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
                duplicateWorkspaceTab,
                deleteWorkspaceTab,
                splitWorkspaceTab,
            },
        });
        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession,
                workspaceExecutor: createWorkspaceExecutor({
                    actions: {
                        executeActiveTab,
                        toggleConnection,
                    },
                }),
                isSidebarOpen: true,
                activeSidebarItem: "script-library",
                onActivateAttachMode,
                onActivateGoToLineMode,
                onActivateThemeMode,
                onOpenWorkspaceScreen,
                onOpenAccounts,
                onOpenExecutionHistory,
                onOpenSettings,
                onRequestRenameCurrentTab,
            }),
        );

        expect(items.map((item) => item.id)).toEqual(
            expect.arrayContaining([
                "command-open-accounts",
                "command-settings",
                "command-attach-executor",
                "command-change-theme",
                "command-open-execution-history",
                "command-create-file",
                "command-execute-tab",
                "command-beautify-tab",
                "command-goto-line",
                "command-rename-tab",
                "command-duplicate-tab",
                "command-delete-tab",
                "command-toggle-split-view",
                "command-split-open-left",
                "command-split-open-right",
            ]),
        );

        const getCommand = (id: string) =>
            items.find((item) => item.id === id) ??
            (() => {
                throw new Error(`Missing command item: ${id}`);
            })();

        getCommand("command-open-accounts").onSelect();
        getCommand("command-settings").onSelect();
        getCommand("command-attach-executor").onSelect();
        getCommand("command-change-theme").onSelect();
        getCommand("command-execute-tab").onSelect();
        getCommand("command-beautify-tab").onSelect();
        getCommand("command-goto-line").onSelect();
        getCommand("command-rename-tab").onSelect();
        getCommand("command-duplicate-tab").onSelect();
        getCommand("command-delete-tab").onSelect();
        getCommand("command-split-open-left").onSelect();
        getCommand("command-split-open-right").onSelect();

        expect(onOpenAccounts).toHaveBeenCalledOnce();
        expect(onOpenSettings).toHaveBeenCalledOnce();
        expect(onActivateAttachMode).toHaveBeenCalledOnce();
        expect(onActivateThemeMode).toHaveBeenCalledOnce();
        expect(executeActiveTab).toHaveBeenCalledOnce();
        expect(onActivateGoToLineMode).toHaveBeenCalledOnce();
        expect(onRequestRenameCurrentTab).toHaveBeenCalledOnce();
        expect(duplicateWorkspaceTab).toHaveBeenCalledWith("tab-1");
        expect(deleteWorkspaceTab).toHaveBeenCalledWith("tab-1");
        expect(splitWorkspaceTab).toHaveBeenNthCalledWith(
            1,
            "tab-1",
            null,
            "left",
        );
        expect(splitWorkspaceTab).toHaveBeenNthCalledWith(
            2,
            "tab-1",
            null,
            "right",
        );
        expect(onOpenWorkspaceScreen).toHaveBeenCalledTimes(5);
        expect(getCommand("command-goto-line")).toMatchObject({
            closeOnSelect: false,
        });
        expect(getCommand("command-attach-executor")).toMatchObject({
            closeOnSelect: false,
            meta: "Mod+Shift+C",
        });
        expect(getCommand("command-open-script-library")).toMatchObject({
            isDisabled: true,
            meta: "Current",
        });
        expect(getCommand("command-change-theme")).toMatchObject({
            closeOnSelect: false,
        });
    });

    it("formats the active Luau tab from the command palette", async () => {
        const updateWorkspaceTabContent = vi.fn();
        const clearErrorMessage = vi.fn();
        const setErrorMessage = vi.fn();
        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession: createWorkspaceSession({
                    state: {
                        workspace: {
                            workspacePath: "/workspace/current",
                            workspaceName: "current",
                            activeTabId: "tab-format",
                            splitView: null,
                            archivedTabs: [],
                            executionHistory: [],
                            tabs: [
                                {
                                    id: "tab-format",
                                    fileName: "alpha.lua",
                                    content: "local x=1",
                                    savedContent: "local x=1",
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
                            id: "tab-format",
                            fileName: "alpha.lua",
                            content: "local x=1",
                            savedContent: "local x=1",
                            isDirty: false,
                            cursor: { line: 0, column: 0, scrollTop: 0 },
                        },
                        activeTabIndex: 0,
                    },
                    editorActions: {
                        clearErrorMessage,
                        setErrorMessage,
                        updateWorkspaceTabContent,
                    },
                }),
            }),
        );

        const beautifyItem = items.find(
            (item) => item.id === "command-beautify-tab",
        );

        expect(beautifyItem).toMatchObject({
            isDisabled: false,
        });

        beautifyItem?.onSelect();
        await Promise.resolve();
        await Promise.resolve();

        expect(platformMocks.formatLuauScript).toHaveBeenCalledWith({
            content: "local x=1",
        });
        expect(updateWorkspaceTabContent).toHaveBeenCalledWith(
            "tab-format",
            "formatted",
        );
        expect(clearErrorMessage).toHaveBeenCalledOnce();
        expect(setErrorMessage).not.toHaveBeenCalled();
    });

    it("offers detach only while attached", () => {
        const toggleConnection = vi.fn().mockResolvedValue(undefined);
        const onOpenWorkspaceScreen = vi.fn();
        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceExecutor: createWorkspaceExecutor({
                    state: {
                        isAttached: true,
                    },
                    actions: {
                        toggleConnection,
                    },
                }),
                onOpenWorkspaceScreen,
            }),
        );
        const attachItem = items.find(
            (item) => item.id === "command-attach-executor",
        );
        const detachItem = items.find(
            (item) => item.id === "command-detach-executor",
        );

        expect(attachItem).toMatchObject({
            isDisabled: true,
        });
        expect(detachItem).toMatchObject({
            isDisabled: false,
            meta: "Mod+Shift+C",
        });

        detachItem?.onSelect();

        expect(onOpenWorkspaceScreen).toHaveBeenCalledOnce();
        expect(toggleConnection).toHaveBeenCalledOnce();
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

    it("builds attach port items for available executor ports", () => {
        const attachToPort = vi.fn().mockResolvedValue(undefined);
        const onOpenWorkspaceScreen = vi.fn();
        const workspaceExecutor = createWorkspaceExecutor({
            state: {
                availablePortSummaries: [
                    {
                        port: 5553,
                        boundAccountId: null,
                        boundAccountDisplayName: null,
                        isBoundToUnknownAccount: false,
                    },
                    {
                        port: 5554,
                        boundAccountId: null,
                        boundAccountDisplayName: null,
                        isBoundToUnknownAccount: false,
                    },
                ],
            },
            actions: {
                attachToPort,
            },
        });
        const items = getAttachCommandPaletteItems({
            workspaceExecutor,
            onOpenWorkspaceScreen,
        });

        expect(items.map((item) => item.id)).toEqual([
            "command-attach-port-5553",
            "command-attach-port-5554",
        ]);

        items[1]?.onSelect();

        expect(onOpenWorkspaceScreen).toHaveBeenCalledOnce();
        expect(attachToPort).toHaveBeenCalledWith(5554);
    });

    it("filters attach port items by the typed port query", () => {
        const workspaceExecutor = createWorkspaceExecutor();
        const options = createCommandPaletteOptions({
            workspaceExecutor,
        });
        const items = getAppCommandPaletteResults({
            ...options,
            activeTab: null,
            goToLineNumber: null,
            hotkeyBindings: {},
            mode: "attach",
            normalizedQuery: "5553",
            scope: "commands",
            theme: "dark",
            onGoToLine: vi.fn(),
            onSetTheme: vi.fn(),
        });

        expect(items.map((item) => item.id)).toEqual([
            "command-attach-port-5553",
        ]);
    });
});
