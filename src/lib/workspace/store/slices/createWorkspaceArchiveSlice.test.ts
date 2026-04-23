import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { WorkspaceStore } from "../workspaceStore.type";

const mocks = vi.hoisted(() => ({
    confirmAction: vi.fn(),
    deleteAllArchivedWorkspaceTabs: vi.fn(),
    deleteArchivedWorkspaceTab: vi.fn(),
    restoreAllArchivedWorkspaceTabs: vi.fn(),
    restoreArchivedWorkspaceTab: vi.fn(),
}));

vi.mock("../../../platform/dialog", () => ({
    confirmAction: mocks.confirmAction,
}));

vi.mock("../../../platform/workspace", () => ({
    deleteAllArchivedWorkspaceTabs: mocks.deleteAllArchivedWorkspaceTabs,
    deleteArchivedWorkspaceTab: mocks.deleteArchivedWorkspaceTab,
    restoreAllArchivedWorkspaceTabs: mocks.restoreAllArchivedWorkspaceTabs,
    restoreArchivedWorkspaceTab: mocks.restoreArchivedWorkspaceTab,
}));

function createWorkspaceStoreState(): WorkspaceStore {
    return {
        workspace: {
            workspacePath: "/workspace/current",
            workspaceName: "current",
            activeTabId: "tab-1",
            splitView: null,
            archivedTabs: [
                {
                    id: "archived-1",
                    fileName: "archived.lua",
                    cursor: {
                        line: 0,
                        column: 0,
                        scrollTop: 0,
                    },
                    archivedAt: 123,
                },
            ],
            executionHistory: [],
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
        },
        dirtyTabCount: 1,
        transientTabCursorsById: {},
        recentWorkspacePaths: [],
        persistRevision: 0,
        lastPersistedRevision: 0,
        isBootstrapping: false,
        isHydrated: true,
        errorMessage: null,
        bootstrapWorkspaceSession: vi.fn(),
        persistWorkspaceState: vi.fn(async () => true),
        refreshWorkspaceFromFilesystem: vi.fn(async () => undefined),
        openWorkspaceDirectory: vi.fn(),
        openWorkspacePath: vi.fn(),
        replaceWorkspaceExecutionHistory: vi.fn(),
        createWorkspaceFile: vi.fn(),
        addWorkspaceScriptTab: vi.fn(),
        importDroppedWorkspaceFiles: vi.fn(),
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

async function createArchiveStore() {
    const { createWorkspaceArchiveSlice } = await import(
        "./createWorkspaceArchiveSlice"
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
    const slice = createWorkspaceArchiveSlice(
        setState as Parameters<typeof createWorkspaceArchiveSlice>[0],
        getState as Parameters<typeof createWorkspaceArchiveSlice>[1],
        {} as Parameters<typeof createWorkspaceArchiveSlice>[2],
    );

    state = {
        ...state,
        ...slice,
    };

    return {
        getState,
    };
}

describe("createWorkspaceArchiveSlice", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        mocks.confirmAction.mockReset();
        mocks.deleteAllArchivedWorkspaceTabs.mockReset();
        mocks.deleteArchivedWorkspaceTab.mockReset();
        mocks.restoreAllArchivedWorkspaceTabs.mockReset();
        mocks.restoreArchivedWorkspaceTab.mockReset();
    });

    it("persists the local archive mutation after archiving a tab", async () => {
        const store = await createArchiveStore();

        mocks.confirmAction.mockResolvedValue(true);

        await store.getState().archiveWorkspaceTab("tab-1");

        expect(store.getState().workspace?.tabs).toEqual([]);
        expect(store.getState().workspace?.archivedTabs).toHaveLength(2);
        expect(
            store
                .getState()
                .workspace?.archivedTabs.some((tab) => tab.id === "tab-1"),
        ).toBe(true);
        expect(store.getState().persistWorkspaceState).toHaveBeenCalledTimes(1);
    });

    it("persists before restoring and refreshes after the backend restore", async () => {
        const store = await createArchiveStore();

        await store.getState().restoreArchivedWorkspaceTab("archived-1");

        expect(store.getState().persistWorkspaceState).toHaveBeenCalledTimes(1);
        expect(mocks.restoreArchivedWorkspaceTab).toHaveBeenCalledWith({
            workspacePath: "/workspace/current",
            tabId: "archived-1",
        });
        expect(
            store.getState().refreshWorkspaceFromFilesystem,
        ).toHaveBeenCalledTimes(1);
    });
});
