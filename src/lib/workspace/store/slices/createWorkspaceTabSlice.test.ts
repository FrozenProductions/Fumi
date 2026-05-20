import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DEFAULT_WORKSPACE_SPLIT_RATIO } from "../../../../constants/workspace/workspace";
import type { WorkspaceSession } from "../../session/session.type";
import { normalizeSplitView } from "../../session/sessionSplitView";
import type {
    WorkspaceLegacySplitView,
    WorkspaceSplitView,
} from "../../session/sessionSplitView.type";
import type { WorkspaceTab } from "../../session/tabs/sessionTabs.type";
import type { WorkspaceStore } from "../workspaceStore.type";

vi.mock("../../../platform/core/dialog", () => ({
    confirmAction: vi.fn(),
}));

vi.mock("../../../platform/workspace/workspace", () => ({
    createWorkspaceFile: vi.fn(),
    deleteAllArchivedWorkspaceTabs: vi.fn(),
    deleteArchivedWorkspaceTab: vi.fn(),
    deleteWorkspaceFile: vi.fn(),
    renameWorkspaceFile: vi.fn(),
    restoreAllArchivedWorkspaceTabs: vi.fn(),
    restoreArchivedWorkspaceTab: vi.fn(),
}));

function createWorkspaceTab(id: string): WorkspaceTab {
    return {
        id,
        fileName: `${id}.lua`,
        content: `print("${id}")`,
        savedContent: `print("${id}")`,
        isDirty: false,
        cursor: {
            line: 0,
            column: 0,
            scrollTop: 0,
        },
    };
}

function createWorkspaceSession(
    overrides: Partial<WorkspaceSession> = {},
): WorkspaceSession {
    return {
        workspacePath: "/workspace/current",
        workspaceName: "current",
        activeTabId: "tab-1",
        splitView: null,
        archivedTabs: [],
        executionHistory: [],
        tabs: [
            createWorkspaceTab("tab-1"),
            createWorkspaceTab("tab-2"),
            createWorkspaceTab("tab-3"),
            createWorkspaceTab("tab-4"),
        ],
        ...overrides,
    };
}

function createWorkspaceSplitView(
    splitView: WorkspaceLegacySplitView,
    tabIds: readonly string[] = ["tab-1", "tab-2", "tab-3", "tab-4"],
): WorkspaceSplitView {
    const normalizedSplitView = normalizeSplitView(splitView, new Set(tabIds));

    if (!normalizedSplitView) {
        throw new Error("Expected test split view to normalize.");
    }

    return normalizedSplitView;
}

async function createTabStore(initialWorkspace: WorkspaceSession) {
    const persistWorkspaceState = vi.fn().mockResolvedValue(true);
    const { createWorkspaceTabSlice } = await import(
        "./createWorkspaceTabSlice"
    );

    let state = {
        workspace: initialWorkspace,
        dirtyTabCount: 0,
        transientTabCursorsById: {},
        recentWorkspacePaths: [],
        persistRevision: 0,
        lastPersistedRevision: 0,
        isBootstrapping: false,
        isHydrated: true,
        errorMessage: null,
        persistWorkspaceState,
    } as unknown as WorkspaceStore;

    const setState = (
        value:
            | Partial<WorkspaceStore>
            | ((currentState: WorkspaceStore) => Partial<WorkspaceStore>),
    ): void => {
        const nextState = typeof value === "function" ? value(state) : value;
        state = {
            ...state,
            ...nextState,
        };
    };

    const getState = (): WorkspaceStore => state;
    const slice = createWorkspaceTabSlice(
        setState as Parameters<typeof createWorkspaceTabSlice>[0],
        getState as Parameters<typeof createWorkspaceTabSlice>[1],
        {} as Parameters<typeof createWorkspaceTabSlice>[2],
    );

    state = {
        ...state,
        ...slice,
    };

    return {
        getState,
        persistWorkspaceState,
    };
}

describe("createWorkspaceTabSlice", () => {
    afterEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it("moves a secondary tab to the primary pane without swapping a left tab into secondary", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                activeTabId: "tab-3",
                splitView: createWorkspaceSplitView({
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-3",
                    secondaryTabIds: ["tab-3", "tab-4"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "secondary",
                }),
            }),
        );

        store.getState().openWorkspaceTabInPane("tab-4", "primary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-4");
        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-tab-4",
            root: {
                direction: "horizontal",
                children: [
                    { id: "pane-primary", tabIds: ["tab-1", "tab-2"] },
                    {
                        id: "pane-tab-4",
                        activeTabId: "tab-4",
                        tabIds: ["tab-4"],
                    },
                    { id: "pane-secondary", tabIds: ["tab-3"] },
                ],
            },
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("moves the current primary tab to the secondary pane and promotes another left tab instead of swapping", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                splitView: createWorkspaceSplitView({
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-3",
                    secondaryTabIds: ["tab-3", "tab-4"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "primary",
                }),
            }),
        );

        store.getState().openWorkspaceTabInPane("tab-1", "secondary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-1");
        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-tab-1",
            root: {
                direction: "horizontal",
                children: [
                    { id: "pane-primary", tabIds: ["tab-2"] },
                    {
                        id: "pane-tab-1",
                        activeTabId: "tab-1",
                        tabIds: ["tab-1"],
                    },
                    { id: "pane-secondary", tabIds: ["tab-3", "tab-4"] },
                ],
            },
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("creates a left split with the dragged tab isolated and every other tab on the right", async () => {
        const store = await createTabStore(createWorkspaceSession());

        store.getState().openWorkspaceTabInPane("tab-3", "primary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-3");
        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-tab-3",
            root: {
                direction: "horizontal",
                children: [
                    {
                        id: "pane-tab-3",
                        activeTabId: "tab-3",
                        tabIds: ["tab-3"],
                    },
                    {
                        id: "pane-root",
                        activeTabId: "tab-1",
                        tabIds: ["tab-1", "tab-2", "tab-4"],
                    },
                ],
            },
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("keeps the dragged active tab alone on the left when opening a new split", async () => {
        const store = await createTabStore(createWorkspaceSession());

        store.getState().openWorkspaceTabInPane("tab-1", "primary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-1");
        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-tab-1",
            root: {
                direction: "horizontal",
                children: [
                    {
                        id: "pane-tab-1",
                        activeTabId: "tab-1",
                        tabIds: ["tab-1"],
                    },
                    {
                        id: "pane-root",
                        activeTabId: "tab-2",
                        tabIds: ["tab-2", "tab-3", "tab-4"],
                    },
                ],
            },
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("creates a top and bottom split when requested", async () => {
        const store = await createTabStore(createWorkspaceSession());

        store
            .getState()
            .openWorkspaceTabInPane("tab-4", "secondary", "horizontal");

        expect(store.getState().workspace?.activeTabId).toBe("tab-4");
        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-tab-4",
            root: {
                direction: "horizontal",
                children: [
                    {
                        id: "pane-root",
                        activeTabId: "tab-1",
                        tabIds: ["tab-1", "tab-2", "tab-3"],
                    },
                    {
                        id: "pane-tab-4",
                        activeTabId: "tab-4",
                        tabIds: ["tab-4"],
                    },
                ],
            },
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("preserves the current split direction when selecting a pane tab", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                splitView: createWorkspaceSplitView({
                    direction: "horizontal",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-3",
                    secondaryTabIds: ["tab-3", "tab-4"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "secondary",
                }),
            }),
        );

        store.getState().openWorkspaceTabInPane("tab-4", "secondary");

        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-tab-4",
            root: {
                direction: "vertical",
                children: [
                    { id: "pane-primary", tabIds: ["tab-1", "tab-2"] },
                    {
                        direction: "horizontal",
                        children: [
                            { id: "pane-secondary", tabIds: ["tab-3"] },
                            { id: "pane-tab-4", tabIds: ["tab-4"] },
                        ],
                    },
                ],
            },
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("updates split ratio in memory without persisting immediately", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                splitView: createWorkspaceSplitView({
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-3",
                    secondaryTabIds: ["tab-3", "tab-4"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "primary",
                }),
            }),
        );

        store.persistWorkspaceState.mockClear();
        store.getState().setWorkspaceSplitRatio(0.68);

        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-primary",
            root: {
                direction: "horizontal",
                ratios: [0.68, 0.31999999999999995],
                children: [
                    { id: "pane-primary", tabIds: ["tab-1", "tab-2"] },
                    { id: "pane-secondary", tabIds: ["tab-3", "tab-4"] },
                ],
            },
        });
        expect(store.persistWorkspaceState).not.toHaveBeenCalled();
    });

    it("resets the split ratio through the legacy direction action", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                splitView: createWorkspaceSplitView({
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-3",
                    secondaryTabIds: ["tab-3", "tab-4"],
                    splitRatio: 0.68,
                    focusedPane: "primary",
                }),
            }),
        );

        store.getState().setWorkspaceSplitDirection("horizontal");

        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-primary",
            root: {
                direction: "horizontal",
                ratios: [
                    DEFAULT_WORKSPACE_SPLIT_RATIO,
                    DEFAULT_WORKSPACE_SPLIT_RATIO,
                ],
                children: [
                    { id: "pane-primary", tabIds: ["tab-1", "tab-2"] },
                    { id: "pane-secondary", tabIds: ["tab-3", "tab-4"] },
                ],
            },
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("swaps panes instead of collapsing when moving the only left tab right", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                activeTabId: "tab-1",
                tabs: [
                    createWorkspaceTab("tab-1"),
                    createWorkspaceTab("tab-2"),
                ],
                splitView: createWorkspaceSplitView(
                    {
                        direction: "vertical",
                        primaryTabId: "tab-1",
                        secondaryTabId: "tab-2",
                        secondaryTabIds: ["tab-2"],
                        splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                        focusedPane: "primary",
                    },
                    ["tab-1", "tab-2"],
                ),
            }),
        );

        store.getState().openWorkspaceTabInPane("tab-1", "secondary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-1");
        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-tab-1",
            root: {
                direction: "horizontal",
                children: [
                    { id: "pane-secondary", tabIds: ["tab-2"] },
                    {
                        id: "pane-tab-1",
                        activeTabId: "tab-1",
                        tabIds: ["tab-1"],
                    },
                ],
            },
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("swaps panes instead of collapsing when moving the only right tab left", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                activeTabId: "tab-2",
                tabs: [
                    createWorkspaceTab("tab-1"),
                    createWorkspaceTab("tab-2"),
                ],
                splitView: createWorkspaceSplitView(
                    {
                        direction: "vertical",
                        primaryTabId: "tab-1",
                        secondaryTabId: "tab-2",
                        secondaryTabIds: ["tab-2"],
                        splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                        focusedPane: "secondary",
                    },
                    ["tab-1", "tab-2"],
                ),
            }),
        );

        store.getState().openWorkspaceTabInPane("tab-2", "primary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-2");
        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-tab-2",
            root: {
                direction: "horizontal",
                children: [
                    {
                        id: "pane-tab-2",
                        activeTabId: "tab-2",
                        tabIds: ["tab-2"],
                    },
                    { id: "pane-primary", tabIds: ["tab-1"] },
                ],
            },
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("keeps split view open when creating a tab in the active pane", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                splitView: createWorkspaceSplitView({
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-3",
                    secondaryTabIds: ["tab-3", "tab-4"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "secondary",
                }),
            }),
        );

        const workspaceCommands = await import(
            "../../../platform/workspace/workspace"
        );

        vi.mocked(workspaceCommands.createWorkspaceFile).mockResolvedValueOnce({
            id: "tab-5",
            fileName: "tab-5.lua",
            content: 'print("tab-5")',
            isDirty: false,
            isPinned: false,
            cursor: {
                line: 0,
                column: 0,
                scrollTop: 0,
            },
        });

        await store.getState().addWorkspaceScriptTab("tab-5.lua", "");

        expect(store.getState().workspace?.activeTabId).toBe("tab-5");
        expect(store.getState().workspace?.splitView).toMatchObject({
            activePaneId: "pane-secondary",
            root: {
                direction: "horizontal",
                children: [
                    { id: "pane-primary", tabIds: ["tab-1", "tab-2"] },
                    {
                        id: "pane-secondary",
                        activeTabId: "tab-5",
                        tabIds: ["tab-3", "tab-4", "tab-5"],
                    },
                ],
            },
        });
        expect(store.persistWorkspaceState).not.toHaveBeenCalled();
    });
});
