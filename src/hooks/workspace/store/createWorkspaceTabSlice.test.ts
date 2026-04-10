import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DEFAULT_WORKSPACE_SPLIT_RATIO } from "../../../constants/workspace/workspace";
import type {
    WorkspaceSession,
    WorkspaceTab,
} from "../../../lib/workspace/workspace.type";
import type { WorkspaceStore } from "./workspaceStore.type";

vi.mock("../../../lib/platform/dialog", () => ({
    confirmAction: vi.fn(),
}));

vi.mock("../../../lib/platform/workspace", () => ({
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
        tabs: [
            createWorkspaceTab("tab-1"),
            createWorkspaceTab("tab-2"),
            createWorkspaceTab("tab-3"),
            createWorkspaceTab("tab-4"),
        ],
        ...overrides,
    };
}

async function createTabStore(initialWorkspace: WorkspaceSession) {
    const persistWorkspaceState = vi.fn().mockResolvedValue(true);
    const { createWorkspaceTabSlice } = await import(
        "./createWorkspaceTabSlice"
    );

    let state = {
        workspace: initialWorkspace,
        recentWorkspacePaths: [],
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
                splitView: {
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-3",
                    secondaryTabIds: ["tab-3", "tab-4"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "secondary",
                },
            }),
        );

        store.getState().openWorkspaceTabInPane("tab-4", "primary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-4");
        expect(store.getState().workspace?.splitView).toEqual({
            direction: "vertical",
            primaryTabId: "tab-4",
            secondaryTabId: "tab-3",
            secondaryTabIds: ["tab-3"],
            splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
            focusedPane: "primary",
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("moves the current primary tab to the secondary pane and promotes another left tab instead of swapping", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                splitView: {
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-3",
                    secondaryTabIds: ["tab-3", "tab-4"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "primary",
                },
            }),
        );

        store.getState().openWorkspaceTabInPane("tab-1", "secondary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-1");
        expect(store.getState().workspace?.splitView).toEqual({
            direction: "vertical",
            primaryTabId: "tab-2",
            secondaryTabId: "tab-1",
            secondaryTabIds: ["tab-3", "tab-4", "tab-1"],
            splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
            focusedPane: "secondary",
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("creates a left split with the dragged tab isolated and every other tab on the right", async () => {
        const store = await createTabStore(createWorkspaceSession());

        store.getState().openWorkspaceTabInPane("tab-3", "primary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-3");
        expect(store.getState().workspace?.splitView).toEqual({
            direction: "vertical",
            primaryTabId: "tab-3",
            secondaryTabId: "tab-1",
            secondaryTabIds: ["tab-1", "tab-2", "tab-4"],
            splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
            focusedPane: "primary",
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("keeps the dragged active tab alone on the left when opening a new split", async () => {
        const store = await createTabStore(createWorkspaceSession());

        store.getState().openWorkspaceTabInPane("tab-1", "primary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-1");
        expect(store.getState().workspace?.splitView).toEqual({
            direction: "vertical",
            primaryTabId: "tab-1",
            secondaryTabId: "tab-2",
            secondaryTabIds: ["tab-2", "tab-3", "tab-4"],
            splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
            focusedPane: "primary",
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });

    it("updates split ratio in memory without persisting immediately", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                splitView: {
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-3",
                    secondaryTabIds: ["tab-3", "tab-4"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "primary",
                },
            }),
        );

        store.persistWorkspaceState.mockClear();
        store.getState().setWorkspaceSplitRatio(0.68);

        expect(store.getState().workspace?.splitView).toEqual({
            direction: "vertical",
            primaryTabId: "tab-1",
            secondaryTabId: "tab-3",
            secondaryTabIds: ["tab-3", "tab-4"],
            splitRatio: 0.68,
            focusedPane: "primary",
        });
        expect(store.persistWorkspaceState).not.toHaveBeenCalled();
    });

    it("swaps panes instead of collapsing when moving the only left tab right", async () => {
        const store = await createTabStore(
            createWorkspaceSession({
                activeTabId: "tab-1",
                tabs: [
                    createWorkspaceTab("tab-1"),
                    createWorkspaceTab("tab-2"),
                ],
                splitView: {
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-2",
                    secondaryTabIds: ["tab-2"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "primary",
                },
            }),
        );

        store.getState().openWorkspaceTabInPane("tab-1", "secondary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-1");
        expect(store.getState().workspace?.splitView).toEqual({
            direction: "vertical",
            primaryTabId: "tab-2",
            secondaryTabId: "tab-1",
            secondaryTabIds: ["tab-1"],
            splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
            focusedPane: "secondary",
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
                splitView: {
                    direction: "vertical",
                    primaryTabId: "tab-1",
                    secondaryTabId: "tab-2",
                    secondaryTabIds: ["tab-2"],
                    splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                    focusedPane: "secondary",
                },
            }),
        );

        store.getState().openWorkspaceTabInPane("tab-2", "primary");

        expect(store.getState().workspace?.activeTabId).toBe("tab-2");
        expect(store.getState().workspace?.splitView).toEqual({
            direction: "vertical",
            primaryTabId: "tab-2",
            secondaryTabId: "tab-1",
            secondaryTabIds: ["tab-1"],
            splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
            focusedPane: "primary",
        });
        expect(store.persistWorkspaceState).toHaveBeenCalledOnce();
    });
});
