import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { WORKSPACE_UNAVAILABLE_ERROR_MESSAGE } from "../../../../constants/workspace/workspace";
import type { WorkspaceSession, WorkspaceSnapshot } from "../../workspace.type";
import type { WorkspaceStore } from "../workspaceStore.type";

const mocks = vi.hoisted(() => ({
    openWorkspace: vi.fn(),
    persistRecentWorkspacePaths: vi.fn(),
    persistWorkspaceState: vi.fn(),
    refreshWorkspace: vi.fn(),
    shouldProceedWithWorkspaceSwitch: vi.fn(),
}));

vi.mock("../../../platform/workspace", () => ({
    bootstrapWorkspace: vi.fn(),
    openWorkspace: mocks.openWorkspace,
    persistWorkspaceState: mocks.persistWorkspaceState,
    refreshWorkspace: mocks.refreshWorkspace,
}));

vi.mock("../../persistence", async () => {
    const actual =
        await vi.importActual<typeof import("../../persistence")>(
            "../../persistence",
        );

    return {
        ...actual,
        persistRecentWorkspacePaths: mocks.persistRecentWorkspacePaths,
    };
});

vi.mock("../workspaceNavigation", async () => {
    const actual = await vi.importActual<
        typeof import("../workspaceNavigation")
    >("../workspaceNavigation");

    return {
        ...actual,
        shouldProceedWithWorkspaceSwitch:
            mocks.shouldProceedWithWorkspaceSwitch,
    };
});

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
            {
                id: "tab-1",
                fileName: "alpha.lua",
                content: "print('saved')",
                savedContent: "print('saved')",
                isDirty: false,
                cursor: {
                    line: 0,
                    column: 0,
                    scrollTop: 0,
                },
            },
        ],
        ...overrides,
    };
}

function createWorkspaceSnapshot(
    overrides: Partial<WorkspaceSnapshot> = {},
): WorkspaceSnapshot {
    return {
        workspacePath: "/workspace/next",
        workspaceName: "next",
        metadata: {
            version: 2,
            activeTabId: "tab-2",
            splitView: null,
            tabs: [
                {
                    id: "tab-2",
                    fileName: "beta.lua",
                    cursor: {
                        line: 0,
                        column: 0,
                        scrollTop: 0,
                    },
                },
            ],
            archivedTabs: [],
            executionHistory: [],
        },
        tabs: [
            {
                id: "tab-2",
                fileName: "beta.lua",
                content: "print('next')",
                isDirty: false,
                cursor: {
                    line: 0,
                    column: 0,
                    scrollTop: 0,
                },
            },
        ],
        ...overrides,
    };
}

async function createLifecycleStore(initialWorkspace?: WorkspaceSession) {
    const { createWorkspaceLifecycleSlice } = await import(
        "./createWorkspaceLifecycleSlice"
    );

    let state = {
        workspace: initialWorkspace ?? null,
        dirtyTabCount:
            initialWorkspace?.tabs.filter(
                (tab) => tab.content !== tab.savedContent,
            ).length ?? 0,
        transientTabCursorsById: {},
        recentWorkspacePaths: ["/workspace/recent"],
        persistRevision: 0,
        lastPersistedRevision: 0,
        isBootstrapping: false,
        isHydrated: false,
        errorMessage: "old error",
    } as WorkspaceStore;

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
    const slice = createWorkspaceLifecycleSlice(
        setState as Parameters<typeof createWorkspaceLifecycleSlice>[0],
        getState as Parameters<typeof createWorkspaceLifecycleSlice>[1],
        {} as Parameters<typeof createWorkspaceLifecycleSlice>[2],
    );

    state = {
        ...state,
        ...slice,
    };

    return {
        getState,
    };
}

describe("createWorkspaceLifecycleSlice", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        mocks.openWorkspace.mockReset();
        mocks.persistRecentWorkspacePaths.mockReset();
        mocks.persistWorkspaceState.mockReset();
        mocks.refreshWorkspace.mockReset();
        mocks.shouldProceedWithWorkspaceSwitch.mockReset();
    });

    it("opens a trimmed workspace path, persists the current workspace, and refreshes recent paths", async () => {
        const store = await createLifecycleStore(createWorkspaceSession());

        mocks.shouldProceedWithWorkspaceSwitch.mockResolvedValue(true);
        mocks.persistWorkspaceState.mockResolvedValue(undefined);
        mocks.openWorkspace.mockResolvedValue(createWorkspaceSnapshot());

        await store.getState().openWorkspacePath("  /workspace/next  ");

        expect(mocks.persistWorkspaceState).toHaveBeenCalledOnce();
        expect(mocks.openWorkspace).toHaveBeenCalledWith("/workspace/next");
        expect(mocks.persistRecentWorkspacePaths).toHaveBeenCalledWith([
            "/workspace/next",
            "/workspace/recent",
        ]);
        expect(store.getState().workspace).toMatchObject({
            workspacePath: "/workspace/next",
            workspaceName: "next",
            activeTabId: "tab-2",
        });
        expect(store.getState().recentWorkspacePaths).toEqual([
            "/workspace/next",
            "/workspace/recent",
        ]);
        expect(store.getState().persistRevision).toBe(0);
        expect(store.getState().lastPersistedRevision).toBe(0);
        expect(store.getState().errorMessage).toBeNull();
        expect(store.getState().isHydrated).toBe(true);
    });

    it("replaces execution history only for the currently open workspace", async () => {
        const store = await createLifecycleStore(createWorkspaceSession());
        const nextHistory = [
            {
                id: "history-1",
                executedAt: 10,
                executorKind: "macsploit" as const,
                port: 5553,
                accountId: null,
                accountDisplayName: null,
                isBoundToUnknownAccount: false,
                fileName: "alpha.lua",
                scriptContent: "print('saved')",
            },
        ];

        store
            .getState()
            .replaceWorkspaceExecutionHistory(
                "/workspace/current",
                nextHistory,
            );
        store
            .getState()
            .replaceWorkspaceExecutionHistory("/workspace/other", []);

        expect(store.getState().workspace?.executionHistory).toEqual(
            nextHistory,
        );
        expect(store.getState().persistRevision).toBe(1);
        expect(store.getState().lastPersistedRevision).toBe(1);
    });

    it("preserves a dirty workspace and shows the unavailable error when the backend reports it missing", async () => {
        const dirtyWorkspace = createWorkspaceSession({
            tabs: [
                {
                    id: "tab-1",
                    fileName: "alpha.lua",
                    content: "print('draft')",
                    savedContent: "print('saved')",
                    isDirty: true,
                    cursor: {
                        line: 0,
                        column: 0,
                        scrollTop: 0,
                    },
                },
            ],
        });
        const store = await createLifecycleStore(dirtyWorkspace);

        mocks.refreshWorkspace.mockResolvedValue(null);

        await store.getState().refreshWorkspaceFromFilesystem();

        expect(store.getState().workspace).toEqual(dirtyWorkspace);
        expect(store.getState().errorMessage).toBe(
            WORKSPACE_UNAVAILABLE_ERROR_MESSAGE,
        );
        expect(store.getState().persistRevision).toBe(0);
        expect(store.getState().lastPersistedRevision).toBe(0);
    });
});
