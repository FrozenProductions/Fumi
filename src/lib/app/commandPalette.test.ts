import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const platformMocks = vi.hoisted(() => ({
    confirmAction: vi.fn().mockResolvedValue(true),
    isTauriEnvironment: vi.fn(() => true),
    killRobloxProcesses: vi.fn().mockResolvedValue(undefined),
    launchRoblox: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../platform/accounts", () => ({
    killRobloxProcesses: platformMocks.killRobloxProcesses,
    launchRoblox: platformMocks.launchRoblox,
}));

vi.mock("../platform/dialog", () => ({
    confirmAction: platformMocks.confirmAction,
}));

vi.mock("../platform/runtime", () => ({
    isTauriEnvironment: platformMocks.isTauriEnvironment,
}));

import type {
    UseWorkspaceExecutorResult,
    WorkspaceExecutorActions,
    WorkspaceExecutorState,
} from "../../hooks/workspace/useWorkspaceExecutor.type";
import type {
    UseWorkspaceSessionResult,
    WorkspaceSessionArchiveActions,
    WorkspaceSessionEditorActions,
    WorkspaceSessionState,
    WorkspaceSessionTabActions,
    WorkspaceSessionWorkspaceActions,
} from "../../hooks/workspace/useWorkspaceSession.type";
import type {
    AppCommandPaletteItem,
    AppSidebarItem,
    AppSidebarPosition,
    AppTheme,
} from "../../lib/app/app.type";
import {
    getCommandCommandPaletteItems,
    getGoToLineCommandPaletteItems,
    getTabCommandPaletteItems,
    getWorkspaceCommandPaletteItems,
    parseGoToLineQuery,
} from "./commandPalette";
import {
    matchesAppCommandPaletteItem,
    normalizeAppCommandPaletteSearchValue,
    searchAppCommandPaletteItems,
} from "./commandPaletteSearch";

type WorkspaceSessionOverrides = {
    state?: Partial<WorkspaceSessionState>;
    workspaceActions?: Partial<WorkspaceSessionWorkspaceActions>;
    tabActions?: Partial<WorkspaceSessionTabActions>;
    archiveActions?: Partial<WorkspaceSessionArchiveActions>;
    editorActions?: Partial<WorkspaceSessionEditorActions>;
};

type WorkspaceExecutorOverrides = {
    state?: Partial<WorkspaceExecutorState>;
    actions?: Partial<WorkspaceExecutorActions>;
};

function createWorkspaceSession(
    overrides: WorkspaceSessionOverrides = {},
): UseWorkspaceSessionResult {
    return {
        state: {
            isBootstrapping: false,
            workspace: null,
            activeTab: null,
            activeTabIndex: -1,
            recentWorkspacePaths: [],
            errorMessage: null,
            hasUnsavedChanges: false,
            ...overrides.state,
        },
        workspaceActions: {
            openWorkspaceDirectory: vi.fn().mockResolvedValue(undefined),
            openWorkspacePath: vi.fn().mockResolvedValue(undefined),
            createWorkspaceFile: vi.fn().mockResolvedValue(undefined),
            addWorkspaceScriptTab: vi.fn().mockResolvedValue(false),
            importDroppedWorkspaceFiles: vi.fn().mockResolvedValue(false),
            ...overrides.workspaceActions,
        },
        tabActions: {
            duplicateWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            archiveWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            deleteWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            renameWorkspaceTab: vi.fn().mockResolvedValue(false),
            selectWorkspaceTab: vi.fn(),
            reorderWorkspaceTab: vi.fn(),
            saveActiveWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            openWorkspaceTabInPane: vi.fn(),
            setWorkspaceSplitRatio: vi.fn(),
            resetWorkspaceSplitView: vi.fn(),
            toggleWorkspaceSplitView: vi.fn(),
            focusWorkspacePane: vi.fn(),
            closeWorkspaceSplitView: vi.fn(),
            ...overrides.tabActions,
        },
        archiveActions: {
            restoreArchivedWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            restoreAllArchivedWorkspaceTabs: vi
                .fn()
                .mockResolvedValue(undefined),
            deleteArchivedWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            deleteAllArchivedWorkspaceTabs: vi
                .fn()
                .mockResolvedValue(undefined),
            ...overrides.archiveActions,
        },
        editorActions: {
            updateActiveTabContent: vi.fn(),
            updateActiveTabCursor: vi.fn(),
            updateActiveTabScrollTop: vi.fn(),
            ...overrides.editorActions,
        },
    };
}

function createWorkspaceExecutor(
    overrides: WorkspaceExecutorOverrides = {},
): UseWorkspaceExecutorResult {
    return {
        state: {
            executorKind: "macsploit",
            availablePorts: [
                5553, 5554, 5555, 5556, 5557, 5558, 5559, 5560, 5561, 5562,
            ],
            hasSupportedExecutor: true,
            port: "5553",
            isAttached: false,
            didRecentAttachFail: false,
            isBusy: false,
            errorMessage: null,
            ...overrides.state,
        },
        actions: {
            updatePort: vi.fn(),
            clearErrorMessage: vi.fn(),
            toggleConnection: vi.fn().mockResolvedValue(undefined),
            executeActiveTab: vi.fn().mockResolvedValue(undefined),
            ...overrides.actions,
        },
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
        sidebarPosition: "left" satisfies AppSidebarPosition,
        hotkeyLabels: {
            activateGoToLine: "Mod+Shift+\\",
            archiveWorkspaceTab: "Mod+W",
            createWorkspaceFile: "Mod+T",
            focusWorkspaceLeftPane: "Ctrl+Mod+1",
            focusWorkspaceRightPane: "Ctrl+Mod+2",
            killRoblox: "Mod+Shift+K",
            launchRoblox: "Mod+Shift+L",
            moveWorkspaceTabToLeftPane: "Ctrl+Mod+Left",
            moveWorkspaceTabToRightPane: "Ctrl+Mod+Right",
            openAccounts: "Mod+Shift+A",
            openSettings: "Mod+,",
            openWorkspaceDirectory: "Mod+O",
            openWorkspaceScreen: "Mod+Shift+W",
            openScriptLibrary: "Mod+Shift+S",
            resetWorkspaceSplitView: "Ctrl+Mod+0",
            toggleOutlinePanel: "Mod+Shift+O",
            toggleSidebar: "Mod+B",
            toggleWorkspaceSplitView: "Mod+\\",
            toggleSidebarPosition: "",
        },
        onActivateGoToLineMode: vi.fn(),
        onOpenWorkspaceScreen: vi.fn(),
        onOpenScriptLibrary: vi.fn(),
        onOpenAccounts: vi.fn(),
        onOpenSettings: vi.fn(),
        isOutlinePanelVisible: true,
        onToggleSidebar: vi.fn(),
        onToggleOutlinePanel: vi.fn(),
        onSetTheme: vi.fn(),
        onSetSidebarPosition: vi.fn(),
        onZoomIn: vi.fn(),
        onZoomOut: vi.fn(),
        onZoomReset: vi.fn(),
        onRequestRenameCurrentTab: vi.fn(),
        ...overrides,
    };
}

function createAppCommandPaletteItem(
    overrides: Partial<AppCommandPaletteItem> &
        Pick<AppCommandPaletteItem, "id" | "label">,
): AppCommandPaletteItem {
    const { id, label, ...restOverrides } = overrides;

    return {
        id,
        label,
        description: "",
        icon: FolderOpenIcon,
        keywords: "",
        onSelect: vi.fn(),
        ...restOverrides,
    };
}

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

describe("Roblox command palette commands", () => {
    it("adds desktop Roblox commands with hotkey metadata", () => {
        platformMocks.isTauriEnvironment.mockReturnValue(true);

        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions(),
        );

        expect(items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: "command-launch-roblox",
                    meta: "Mod+Shift+L",
                    isDisabled: false,
                }),
                expect.objectContaining({
                    id: "command-kill-roblox",
                    meta: "Mod+Shift+K",
                    isDisabled: false,
                }),
            ]),
        );
    });

    it("disables Roblox commands outside the desktop shell", () => {
        platformMocks.isTauriEnvironment.mockReturnValue(false);

        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions(),
        );

        expect(
            items.find((item) => item.id === "command-launch-roblox"),
        ).toMatchObject({
            isDisabled: true,
            description: "Roblox controls require the Tauri desktop shell.",
        });
        expect(
            items.find((item) => item.id === "command-kill-roblox"),
        ).toMatchObject({
            isDisabled: true,
            description: "Roblox controls require the Tauri desktop shell.",
        });
    });

    it("launches Roblox and confirms before killing Roblox", async () => {
        platformMocks.isTauriEnvironment.mockReturnValue(true);
        platformMocks.confirmAction.mockResolvedValue(true);

        const onOpenWorkspaceScreen = vi.fn();
        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                onOpenWorkspaceScreen,
            }),
        );
        const launchItem = items.find(
            (item) => item.id === "command-launch-roblox",
        );
        const killItem = items.find(
            (item) => item.id === "command-kill-roblox",
        );

        launchItem?.onSelect();
        killItem?.onSelect();
        await Promise.resolve();

        expect(onOpenWorkspaceScreen).toHaveBeenCalledTimes(2);
        expect(platformMocks.launchRoblox).toHaveBeenCalledOnce();
        expect(platformMocks.confirmAction).toHaveBeenCalledWith(
            "Attempt to close Roblox?",
        );
        expect(platformMocks.killRobloxProcesses).toHaveBeenCalledOnce();
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

describe("getGoToLineCommandPaletteItems", () => {
    it("keeps go-to-line items driven only by the parsed line number", () => {
        const onGoToLine = vi.fn();
        const [item] = getGoToLineCommandPaletteItems({
            activeTab: {
                id: "tab-1",
                fileName: "alpha.lua",
                content: "alpha",
                savedContent: "alpha",
                isDirty: false,
                cursor: { line: 0, column: 0, scrollTop: 0 },
            },
            goToLineNumber: 12,
            onGoToLine,
        });

        expect(item).toMatchObject({
            id: "command-goto-line",
            label: "Go to line 12",
            description: "Jump within alpha.lua.",
            isDisabled: false,
        });

        item?.onSelect();

        expect(onGoToLine).toHaveBeenCalledWith(12);
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

describe("searchAppCommandPaletteItems", () => {
    it("ranks exact label matches above keyword-only and description-only matches", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "description",
                label: "Open panel",
                description: "Adjust settings quickly.",
            }),
            createAppCommandPaletteItem({
                id: "keyword",
                label: "Open panel",
                keywords: "settings preferences configuration",
            }),
            createAppCommandPaletteItem({
                id: "label",
                label: "Settings",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "settings", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["label", "keyword", "description"]);
    });

    it("ranks token prefixes above generic substrings", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "substring",
                label: "Breathe deeply",
            }),
            createAppCommandPaletteItem({
                id: "token-prefix",
                label: "Theme settings",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "the", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["token-prefix", "substring"]);
    });

    it("ranks consecutive fuzzy matches above gapped fuzzy matches", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "gapped",
                label: "Orbit panel window",
            }),
            createAppCommandPaletteItem({
                id: "consecutive",
                label: "Open workspace",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "opw", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["consecutive", "gapped"]);
    });

    it("ranks word-boundary matches above mid-word fuzzy matches", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "mid-word",
                label: "Crystal cave",
            }),
            createAppCommandPaletteItem({
                id: "boundary",
                label: "Script library",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "sl", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["boundary", "mid-word"]);
    });

    it("matches workspace paths containing separators through normalized tokens", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "path",
                label: "Recent project",
                meta: "~/Projects/fumi.alpha_workspace/main-tab.lua",
            }),
            createAppCommandPaletteItem({
                id: "other",
                label: "Archive project",
                meta: "~/Projects/legacy/beta.lua",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(
                items,
                "alpha workspace main tab",
                items.length,
            ).map((item) => item.id),
        ).toEqual(["path"]);
    });

    it("keeps alias searches working through keywords", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "settings",
                label: "Open settings",
                keywords: "settings preferences configuration",
            }),
            createAppCommandPaletteItem({
                id: "workspace",
                label: "Open workspace",
                keywords: "folder files tabs",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(
                items,
                "preferences",
                items.length,
            ).map((item) => item.id),
        ).toEqual(["settings"]);
    });

    it("preserves the original item order for empty queries", () => {
        const items = [
            createAppCommandPaletteItem({ id: "first", label: "First" }),
            createAppCommandPaletteItem({ id: "second", label: "Second" }),
            createAppCommandPaletteItem({ id: "third", label: "Third" }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["first", "second", "third"]);
    });

    it("keeps single-character queries conservative", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "workspace",
                label: "Open workspace",
            }),
            createAppCommandPaletteItem({
                id: "accounts",
                label: "Manage accounts",
            }),
        ];

        expect(searchAppCommandPaletteItems(items, "z", items.length)).toEqual(
            [],
        );
    });

    it("keeps the original order when scores tie", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "first",
                label: "Workspace tools",
            }),
            createAppCommandPaletteItem({
                id: "second",
                label: "Workspace tools",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "workspace", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["first", "second"]);
    });

    it("caps the result count to the requested limit", () => {
        const items = [
            createAppCommandPaletteItem({ id: "1", label: "Tab one" }),
            createAppCommandPaletteItem({ id: "2", label: "Tab two" }),
            createAppCommandPaletteItem({ id: "3", label: "Tab three" }),
            createAppCommandPaletteItem({ id: "4", label: "Tab four" }),
            createAppCommandPaletteItem({ id: "5", label: "Tab five" }),
            createAppCommandPaletteItem({ id: "6", label: "Tab six" }),
        ];

        expect(searchAppCommandPaletteItems(items, "tab", 5)).toHaveLength(5);
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

describe("getCommandCommandPaletteItems", () => {
    it("includes navigation, zoom, theme, and workspace commands without an active tab", () => {
        platformMocks.isTauriEnvironment.mockReturnValue(true);

        const noWorkspaceItems = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                workspaceSession: createWorkspaceSession(),
                activeSidebarItem: "workspace",
                theme: "light",
            }),
        );

        expect(noWorkspaceItems).toHaveLength(15);
        expect(noWorkspaceItems.map((item) => item.id)).toEqual(
            expect.arrayContaining([
                "command-open-workspace-screen",
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
                "command-theme-system",
                "command-theme-light",
                "command-theme-dark",
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
            noWorkspaceItems.find((item) => item.id === "command-theme-light"),
        ).toMatchObject({
            isDisabled: true,
            meta: "Current",
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
        const onOpenWorkspaceScreen = vi.fn();
        const onOpenAccounts = vi.fn();
        const onOpenSettings = vi.fn();
        const onSetTheme = vi.fn();
        const onRequestRenameCurrentTab = vi.fn();

        const workspaceSession = createWorkspaceSession({
            state: {
                workspace: {
                    workspacePath: "/workspace/current",
                    workspaceName: "current",
                    activeTabId: "tab-1",
                    splitView: null,
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
                theme: "dark",
                onActivateGoToLineMode,
                onOpenWorkspaceScreen,
                onOpenAccounts,
                onOpenSettings,
                onSetTheme,
                onRequestRenameCurrentTab,
            }),
        );

        expect(items.map((item) => item.id)).toEqual(
            expect.arrayContaining([
                "command-open-accounts",
                "command-settings",
                "command-theme-system",
                "command-theme-light",
                "command-theme-dark",
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
        getCommand("command-theme-system").onSelect();
        getCommand("command-theme-light").onSelect();
        getCommand("command-execute-tab").onSelect();
        getCommand("command-goto-line").onSelect();
        getCommand("command-rename-tab").onSelect();
        getCommand("command-duplicate-tab").onSelect();
        getCommand("command-delete-tab").onSelect();
        getCommand("command-split-open-left").onSelect();
        getCommand("command-split-open-right").onSelect();

        expect(onOpenAccounts).toHaveBeenCalledOnce();
        expect(onOpenSettings).toHaveBeenCalledOnce();
        expect(onSetTheme).toHaveBeenNthCalledWith(1, "system");
        expect(onSetTheme).toHaveBeenNthCalledWith(2, "light");
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
        expect(getCommand("command-theme-dark")).toMatchObject({
            isDisabled: true,
            meta: "Current",
        });
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
