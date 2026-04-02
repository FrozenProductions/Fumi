import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { describe, expect, it, vi } from "vite-plus/test";
import type { AppCommandPaletteItem } from "../../lib/app/app.type";
import type { UseWorkspaceSessionResult } from "../../lib/workspace/workspace.type";
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
    it("only includes workspace and active-tab commands when their prerequisites exist", () => {
        const onActivateGoToLineMode = vi.fn();
        const onOpenSettings = vi.fn();
        const onToggleSidebar = vi.fn();
        const noWorkspaceItems = getCommandCommandPaletteItems({
            workspaceSession: createWorkspaceSession(),
            isSidebarOpen: false,
            onActivateGoToLineMode,
            onOpenSettings,
            onToggleSidebar,
        });

        expect(noWorkspaceItems.map((item) => item.id)).toEqual([
            "command-sidebar",
            "command-settings",
            "command-open-workspace",
        ]);

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
        });
        const items = getCommandCommandPaletteItems({
            workspaceSession,
            isSidebarOpen: true,
            onActivateGoToLineMode,
            onOpenSettings,
            onToggleSidebar,
        });

        expect(items.map((item) => item.id)).toEqual([
            "command-sidebar",
            "command-settings",
            "command-open-workspace",
            "command-create-file",
            "command-goto-line",
            "command-save-tab",
            "command-archive-tab",
        ]);

        items[0]?.onSelect();
        items[1]?.onSelect();
        items[4]?.onSelect();

        expect(onToggleSidebar).toHaveBeenCalledOnce();
        expect(onOpenSettings).toHaveBeenCalledOnce();
        expect(onActivateGoToLineMode).toHaveBeenCalledOnce();
        expect(items[4]).toMatchObject({
            closeOnSelect: false,
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
