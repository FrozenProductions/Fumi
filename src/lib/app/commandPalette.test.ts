import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { describe, expect, it, vi } from "vite-plus/test";
import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/useWorkspaceExecutor.type";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type {
    AppCommandPaletteItem,
    AppSidebarItem,
    AppTheme,
} from "../../lib/app/app.type";
import {
    getCommandCommandPaletteItems,
    getTabCommandPaletteItems,
    getWorkspaceCommandPaletteItems,
    matchesAppCommandPaletteItem,
    normalizeAppCommandPaletteSearchValue,
    parseGoToLineQuery,
} from "./commandPalette";

function createWorkspaceSession(
    overrides: Partial<UseWorkspaceSessionResult> = {},
): UseWorkspaceSessionResult {
    return {
        isBootstrapping: false,
        workspace: null,
        activeTab: null,
        activeTabIndex: -1,
        recentWorkspacePaths: [],
        errorMessage: null,
        hasUnsavedChanges: false,
        openWorkspaceDirectory: vi.fn().mockResolvedValue(undefined),
        openWorkspacePath: vi.fn().mockResolvedValue(undefined),
        createWorkspaceFile: vi.fn().mockResolvedValue(undefined),
        addWorkspaceScriptTab: vi.fn().mockResolvedValue(false),
        archiveWorkspaceTab: vi.fn().mockResolvedValue(undefined),
        deleteWorkspaceTab: vi.fn().mockResolvedValue(undefined),
        restoreArchivedWorkspaceTab: vi.fn().mockResolvedValue(undefined),
        restoreAllArchivedWorkspaceTabs: vi.fn().mockResolvedValue(undefined),
        deleteArchivedWorkspaceTab: vi.fn().mockResolvedValue(undefined),
        deleteAllArchivedWorkspaceTabs: vi.fn().mockResolvedValue(undefined),
        renameWorkspaceTab: vi.fn().mockResolvedValue(false),
        selectWorkspaceTab: vi.fn(),
        reorderWorkspaceTab: vi.fn(),
        saveActiveWorkspaceTab: vi.fn().mockResolvedValue(undefined),
        updateActiveTabContent: vi.fn(),
        updateActiveTabCursor: vi.fn(),
        updateActiveTabScrollTop: vi.fn(),
        ...overrides,
    };
}

function createWorkspaceExecutor(
    overrides: Partial<UseWorkspaceExecutorResult> = {},
): UseWorkspaceExecutorResult {
    return {
        port: "5553",
        isAttached: false,
        didRecentAttachFail: false,
        isBusy: false,
        errorMessage: null,
        updatePort: vi.fn(),
        clearErrorMessage: vi.fn(),
        toggleConnection: vi.fn().mockResolvedValue(undefined),
        executeActiveTab: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function createCommandPaletteOptions(
    overrides: Partial<
        Parameters<typeof getCommandCommandPaletteItems>[0]
    > = {},
): Parameters<typeof getCommandCommandPaletteItems>[0] {
    return {
        workspaceSession: createWorkspaceSession(),
        workspaceExecutor: createWorkspaceExecutor(),
        isSidebarOpen: false,
        activeSidebarItem: "workspace" satisfies AppSidebarItem,
        theme: "light" satisfies AppTheme,
        onActivateGoToLineMode: vi.fn(),
        onOpenWorkspaceScreen: vi.fn(),
        onOpenScriptLibrary: vi.fn(),
        onOpenSettings: vi.fn(),
        onToggleSidebar: vi.fn(),
        onSetTheme: vi.fn(),
        onZoomIn: vi.fn(),
        onZoomOut: vi.fn(),
        onZoomReset: vi.fn(),
        onRequestRenameCurrentTab: vi.fn(),
        ...overrides,
    };
}

describe("normalizeAppCommandPaletteSearchValue", () => {
    it("trims and lowercases the query", () => {
        expect(normalizeAppCommandPaletteSearchValue("  Go To Line  ")).toBe(
            "go to line",
        );
    });
});

describe("parseGoToLineQuery", () => {
    it("accepts supported go-to-line formats", () => {
        expect(parseGoToLineQuery("12")).toBe(12);
        expect(parseGoToLineQuery(":12")).toBe(12);
        expect(parseGoToLineQuery("line 12")).toBe(12);
        expect(parseGoToLineQuery("go to line 12:4")).toBe(12);
    });

    it("rejects empty, zero, and invalid input", () => {
        expect(parseGoToLineQuery("")).toBeNull();
        expect(parseGoToLineQuery("0")).toBeNull();
        expect(parseGoToLineQuery("line twelve")).toBeNull();
        expect(parseGoToLineQuery("12:abc")).toBeNull();
    });
});

describe("matchesAppCommandPaletteItem", () => {
    it("matches across label, description, keywords, and meta fields", () => {
        const item: AppCommandPaletteItem = {
            id: "command-open-settings",
            label: "Open settings",
            description: "Adjust the editor and app preferences.",
            icon: FolderOpenIcon,
            meta: "Mod+,",
            keywords: "settings preferences configuration",
            onSelect: vi.fn(),
        };

        expect(matchesAppCommandPaletteItem(item, "settings")).toBe(true);
        expect(matchesAppCommandPaletteItem(item, "preferences")).toBe(true);
        expect(matchesAppCommandPaletteItem(item, "mod+,")).toBe(true);
        expect(matchesAppCommandPaletteItem(item, "missing")).toBe(false);
    });
});

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

        expect(workspaceSession.openWorkspaceDirectory).toHaveBeenCalledOnce();
    });

    it("returns tab items with active-tab keywords and selection handlers", () => {
        const selectWorkspaceTab = vi.fn();
        const workspaceSession = createWorkspaceSession({
            workspace: {
                workspacePath: "/workspace/current",
                workspaceName: "current",
                activeTabId: "tab-2",
                archivedTabs: [],
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
            selectWorkspaceTab,
        });

        const items = getTabCommandPaletteItems(workspaceSession);

        expect(items.map((item) => item.label)).toEqual(["alpha", "beta"]);
        expect(items[1]?.keywords).toContain("active current selected");

        items[0]?.onSelect();

        expect(selectWorkspaceTab).toHaveBeenCalledWith("tab-1");
    });
});

describe("getCommandCommandPaletteItems", () => {
    it("includes navigation, zoom, theme, and workspace commands without an active tab", () => {
        const noWorkspaceItems = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession: createWorkspaceSession(),
                activeSidebarItem: "workspace",
                theme: "light",
            }),
        );

        expect(noWorkspaceItems.map((item) => item.id)).toEqual([
            "command-open-workspace-screen",
            "command-open-script-library",
            "command-settings",
            "command-open-workspace-folder",
            "command-sidebar",
            "command-zoom-in",
            "command-zoom-out",
            "command-zoom-reset",
            "command-theme-light",
            "command-theme-dark",
        ]);

        expect(noWorkspaceItems[0]).toMatchObject({
            isDisabled: true,
            meta: "Current",
        });
        expect(noWorkspaceItems[8]).toMatchObject({
            isDisabled: true,
            meta: "Current",
        });
    });

    it("dispatches the new navigation, theme, zoom, and active-tab commands", () => {
        const executeActiveTab = vi.fn().mockResolvedValue(undefined);
        const deleteWorkspaceTab = vi.fn().mockResolvedValue(undefined);
        const onActivateGoToLineMode = vi.fn();
        const onOpenWorkspaceScreen = vi.fn();
        const onOpenScriptLibrary = vi.fn();
        const onOpenSettings = vi.fn();
        const onToggleSidebar = vi.fn();
        const onSetTheme = vi.fn();
        const onZoomIn = vi.fn();
        const onZoomOut = vi.fn();
        const onZoomReset = vi.fn();
        const onRequestRenameCurrentTab = vi.fn();

        const workspaceSession = createWorkspaceSession({
            workspace: {
                workspacePath: "/workspace/current",
                workspaceName: "current",
                activeTabId: "tab-1",
                archivedTabs: [],
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
            deleteWorkspaceTab,
        });
        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession,
                workspaceExecutor: createWorkspaceExecutor({
                    executeActiveTab,
                }),
                isSidebarOpen: true,
                activeSidebarItem: "script-library",
                theme: "dark",
                onActivateGoToLineMode,
                onOpenWorkspaceScreen,
                onOpenScriptLibrary,
                onOpenSettings,
                onToggleSidebar,
                onSetTheme,
                onZoomIn,
                onZoomOut,
                onZoomReset,
                onRequestRenameCurrentTab,
            }),
        );

        expect(items.map((item) => item.id)).toEqual([
            "command-open-workspace-screen",
            "command-open-script-library",
            "command-settings",
            "command-open-workspace-folder",
            "command-sidebar",
            "command-zoom-in",
            "command-zoom-out",
            "command-zoom-reset",
            "command-theme-light",
            "command-theme-dark",
            "command-create-file",
            "command-execute-tab",
            "command-goto-line",
            "command-save-tab",
            "command-rename-tab",
            "command-archive-tab",
            "command-delete-tab",
        ]);

        items[0]?.onSelect();
        items[2]?.onSelect();
        items[4]?.onSelect();
        items[5]?.onSelect();
        items[6]?.onSelect();
        items[7]?.onSelect();
        items[8]?.onSelect();
        items[11]?.onSelect();
        items[12]?.onSelect();
        items[14]?.onSelect();
        items[16]?.onSelect();

        expect(onOpenWorkspaceScreen).toHaveBeenCalledTimes(2);
        expect(onOpenScriptLibrary).not.toHaveBeenCalled();
        expect(onOpenSettings).toHaveBeenCalledOnce();
        expect(onToggleSidebar).toHaveBeenCalledOnce();
        expect(onZoomIn).toHaveBeenCalledOnce();
        expect(onZoomOut).toHaveBeenCalledOnce();
        expect(onZoomReset).toHaveBeenCalledOnce();
        expect(onSetTheme).toHaveBeenCalledWith("light");
        expect(executeActiveTab).toHaveBeenCalledOnce();
        expect(onActivateGoToLineMode).toHaveBeenCalledOnce();
        expect(onRequestRenameCurrentTab).toHaveBeenCalledOnce();
        expect(deleteWorkspaceTab).toHaveBeenCalledWith("tab-1");
        expect(items[12]).toMatchObject({
            closeOnSelect: false,
        });
        expect(items[1]).toMatchObject({
            isDisabled: true,
            meta: "Current",
        });
        expect(items[9]).toMatchObject({
            isDisabled: true,
            meta: "Current",
        });
    });
});

describe("getWorkspaceCommandPaletteItems", () => {
    it("excludes the current workspace from recent workspace results", () => {
        const openWorkspacePath = vi.fn().mockResolvedValue(undefined);
        const workspaceSession = createWorkspaceSession({
            workspace: {
                workspacePath: "/Users/dayte/projects/current",
                workspaceName: "current",
                activeTabId: null,
                tabs: [],
                archivedTabs: [
                    {
                        id: "archived-1",
                        fileName: "old.lua",
                        cursor: { line: 0, column: 0, scrollTop: 0 },
                    },
                ],
            },
            recentWorkspacePaths: [
                "/Users/dayte/projects/current",
                "/Users/dayte/projects/other",
                "/Users/dayte/projects/archive",
            ],
            openWorkspacePath,
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
