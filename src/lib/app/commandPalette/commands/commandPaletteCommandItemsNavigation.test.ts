import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { getCommandCommandPaletteItems } from "../commandPalette";
import {
    createCommandPaletteOptions,
    createWorkspaceExecutor,
    createWorkspaceSession,
} from "../commandPaletteTestUtils";

const platformMocks = vi.hoisted(() => ({
    confirmAction: vi.fn().mockResolvedValue(true),
    isTauriEnvironment: vi.fn(() => true),
    killRobloxProcesses: vi.fn().mockResolvedValue(undefined),
    launchRoblox: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../platform/accounts", () => ({
    killRobloxProcesses: platformMocks.killRobloxProcesses,
    launchRoblox: platformMocks.launchRoblox,
}));

vi.mock("../../../platform/dialog", () => ({
    confirmAction: platformMocks.confirmAction,
}));

vi.mock("../../../platform/runtime", () => ({
    isTauriEnvironment: platformMocks.isTauriEnvironment,
}));

beforeEach(() => {
    platformMocks.confirmAction.mockReset();
    platformMocks.confirmAction.mockResolvedValue(true);
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

        expect(noWorkspaceItems).toHaveLength(15);
        expect(noWorkspaceItems.map((item) => item.id)).toEqual(
            expect.arrayContaining([
                "command-open-workspace-screen",
                "command-open-automatic-execution",
                "command-open-script-library",
                "command-open-accounts",
                "command-settings",
                "command-open-workspace-folder",
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
        const openWorkspaceTabInPane = vi.fn();
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
                openWorkspaceTabInPane,
            },
        });
        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession,
                workspaceExecutor: createWorkspaceExecutor({
                    actions: {
                        executeActiveTab,
                    },
                }),
                isSidebarOpen: true,
                activeSidebarItem: "script-library",
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
                "command-change-theme",
                "command-open-execution-history",
                "command-create-file",
                "command-execute-tab",
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
        getCommand("command-change-theme").onSelect();
        getCommand("command-execute-tab").onSelect();
        getCommand("command-goto-line").onSelect();
        getCommand("command-rename-tab").onSelect();
        getCommand("command-duplicate-tab").onSelect();
        getCommand("command-delete-tab").onSelect();
        getCommand("command-split-open-left").onSelect();
        getCommand("command-split-open-right").onSelect();

        expect(onOpenAccounts).toHaveBeenCalledOnce();
        expect(onOpenSettings).toHaveBeenCalledOnce();
        expect(onActivateThemeMode).toHaveBeenCalledOnce();
        expect(executeActiveTab).toHaveBeenCalledOnce();
        expect(onActivateGoToLineMode).toHaveBeenCalledOnce();
        expect(onRequestRenameCurrentTab).toHaveBeenCalledOnce();
        expect(duplicateWorkspaceTab).toHaveBeenCalledWith("tab-1");
        expect(deleteWorkspaceTab).toHaveBeenCalledWith("tab-1");
        expect(openWorkspaceTabInPane).toHaveBeenNthCalledWith(
            1,
            "tab-1",
            "primary",
        );
        expect(openWorkspaceTabInPane).toHaveBeenNthCalledWith(
            2,
            "tab-1",
            "secondary",
        );
        expect(onOpenWorkspaceScreen).toHaveBeenCalledTimes(4);
        expect(getCommand("command-goto-line")).toMatchObject({
            closeOnSelect: false,
        });
        expect(getCommand("command-open-script-library")).toMatchObject({
            isDisabled: true,
            meta: "Current",
        });
        expect(getCommand("command-change-theme")).toMatchObject({
            closeOnSelect: false,
        });
    });
});
