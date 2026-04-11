import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { WORKSPACE_UNAVAILABLE_ERROR_MESSAGE } from "../../../constants/workspace/workspace";
import type {
    WorkspaceSession,
    WorkspaceSnapshot,
} from "../../../lib/workspace/workspace.type";
import type { WorkspaceStore } from "./workspaceStore.type";

const mocks = vi.hoisted(() => ({
    markWorkspacePersistedSignature: vi.fn(),
    openWorkspace: vi.fn(),
    persistRecentWorkspacePaths: vi.fn(),
    persistWorkspaceState: vi.fn(),
    refreshWorkspace: vi.fn(),
    shouldProceedWithWorkspaceSwitch: vi.fn(),
}));

vi.mock("../../../lib/platform/workspace", () => ({
    bootstrapWorkspace: vi.fn(),
    openWorkspace: mocks.openWorkspace,
    persistWorkspaceState: mocks.persistWorkspaceState,
    refreshWorkspace: mocks.refreshWorkspace,
}));

vi.mock("../../../lib/workspace/persistence", async () => {
    const actual = await vi.importActual<
        typeof import("../../../lib/workspace/persistence")
    >("../../../lib/workspace/persistence");

    return {
        ...actual,
        getWorkspacePersistSignature: vi.fn(
            (workspace: WorkspaceSession | null) =>
                workspace ? `signature:${workspace.workspacePath}` : null,
        ),
        markWorkspacePersistedSignature: mocks.markWorkspacePersistedSignature,
        persistRecentWorkspacePaths: mocks.persistRecentWorkspacePaths,
    };
});

vi.mock("./helpers", async () => {
    const actual =
        await vi.importActual<typeof import("./helpers")>("./helpers");

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
        recentWorkspacePaths: ["/workspace/recent"],
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
        mocks.markWorkspacePersistedSignature.mockReset();
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
        expect(mocks.markWorkspacePersistedSignature).toHaveBeenLastCalledWith(
            "signature:/workspace/next",
        );
        expect(store.getState().workspace).toMatchObject({
            workspacePath: "/workspace/next",
            workspaceName: "next",
            activeTabId: "tab-2",
        });
        expect(store.getState().recentWorkspacePaths).toEqual([
            "/workspace/next",
            "/workspace/recent",
        ]);
        expect(store.getState().errorMessage).toBeNull();
        expect(store.getState().isHydrated).toBe(true);
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
        expect(mocks.markWorkspacePersistedSignature).not.toHaveBeenCalled();
    });
});
