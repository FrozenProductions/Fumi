import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { WorkspaceStore } from "./workspaceStore.type";

const mocks = vi.hoisted(() => ({
    confirmAction: vi.fn(),
    createWorkspaceFile: vi.fn(),
    deleteWorkspaceFile: vi.fn(),
    markWorkspacePersistedSignature: vi.fn(),
    renameWorkspaceFile: vi.fn(),
}));

vi.mock("../../../lib/platform/dialog", () => ({
    confirmAction: mocks.confirmAction,
}));

vi.mock("../../../lib/platform/workspace", () => ({
    createWorkspaceFile: mocks.createWorkspaceFile,
    deleteWorkspaceFile: mocks.deleteWorkspaceFile,
    renameWorkspaceFile: mocks.renameWorkspaceFile,
}));

vi.mock("../../../lib/workspace/persistence", async () => {
    const actual = await vi.importActual<
        typeof import("../../../lib/workspace/persistence")
    >("../../../lib/workspace/persistence");

    return {
        ...actual,
        getWorkspacePersistSignature: vi.fn(
            () => "signature:/workspace/current",
        ),
        markWorkspacePersistedSignature: mocks.markWorkspacePersistedSignature,
    };
});

function createWorkspaceStoreState(): WorkspaceStore {
    return {
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
                    content: "print('alpha')",
                    savedContent: "print('alpha')",
                    isDirty: false,
                    cursor: {
                        line: 0,
                        column: 0,
                        scrollTop: 0,
                    },
                },
            ],
        },
        recentWorkspacePaths: [],
        isBootstrapping: false,
        isHydrated: true,
        errorMessage: null,
        bootstrapWorkspaceSession: vi.fn(),
        persistWorkspaceState: vi.fn(async () => true),
        refreshWorkspaceFromFilesystem: vi.fn(),
        openWorkspaceDirectory: vi.fn(),
        openWorkspacePath: vi.fn(),
        createWorkspaceFile: vi.fn(),
        addWorkspaceScriptTab: vi.fn(),
        duplicateWorkspaceTab: vi.fn(),
        archiveWorkspaceTab: vi.fn(),
        deleteWorkspaceTab: vi.fn(),
        restoreArchivedWorkspaceTab: vi.fn(),
        restoreAllArchivedWorkspaceTabs: vi.fn(),
        deleteArchivedWorkspaceTab: vi.fn(),
        deleteAllArchivedWorkspaceTabs: vi.fn(),
        renameWorkspaceTab: vi.fn(),
        selectWorkspaceTab: vi.fn(),
        reorderWorkspaceTab: vi.fn(),
        openWorkspaceTabInPane: vi.fn(),
        setWorkspaceSplitRatio: vi.fn(),
        resetWorkspaceSplitView: vi.fn(),
        toggleWorkspaceSplitView: vi.fn(),
        focusWorkspacePane: vi.fn(),
        closeWorkspaceSplitView: vi.fn(),
        saveActiveWorkspaceTab: vi.fn(),
        updateActiveTabContent: vi.fn(),
        updateActiveTabCursor: vi.fn(),
        updateActiveTabScrollTop: vi.fn(),
        setErrorMessage: vi.fn(),
        clearErrorMessage: vi.fn(),
    };
}

async function createFileStore() {
    const { createWorkspaceFileSlice } = await import(
        "./createWorkspaceFileSlice"
    );

    let state = createWorkspaceStoreState();

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
    const slice = createWorkspaceFileSlice(
        setState as Parameters<typeof createWorkspaceFileSlice>[0],
        getState as Parameters<typeof createWorkspaceFileSlice>[1],
        {} as Parameters<typeof createWorkspaceFileSlice>[2],
    );

    state = {
        ...state,
        ...slice,
    };

    return {
        getState,
    };
}

describe("createWorkspaceFileSlice", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        mocks.confirmAction.mockReset();
        mocks.createWorkspaceFile.mockReset();
        mocks.deleteWorkspaceFile.mockReset();
        mocks.markWorkspacePersistedSignature.mockReset();
        mocks.renameWorkspaceFile.mockReset();
    });

    it("marks the next workspace as persisted after creating a file", async () => {
        const store = await createFileStore();

        mocks.createWorkspaceFile.mockResolvedValue({
            id: "tab-2",
            fileName: "beta.lua",
            content: "print('beta')",
            isDirty: false,
            cursor: {
                line: 0,
                column: 0,
                scrollTop: 0,
            },
        });

        await store.getState().createWorkspaceFile();

        expect(store.getState().workspace?.activeTabId).toBe("tab-2");
        expect(mocks.markWorkspacePersistedSignature).toHaveBeenCalledWith(
            "signature:/workspace/current",
        );
    });
});
