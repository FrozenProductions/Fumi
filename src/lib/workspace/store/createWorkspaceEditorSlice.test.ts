import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { WorkspaceStore } from "./workspaceStore.type";

const mocks = vi.hoisted(() => ({
    saveWorkspaceFile: vi.fn(),
}));

vi.mock("../../../lib/platform/workspace", () => ({
    saveWorkspaceFile: mocks.saveWorkspaceFile,
}));

function createWorkspaceStoreState(
    overrides: Partial<WorkspaceStore> = {},
): WorkspaceStore {
    const {
        persistRevision = 0,
        lastPersistedRevision = 0,
        transientTabCursorsById = {},
        ...restOverrides
    } = overrides;

    return {
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
        },
        dirtyTabCount: 0,
        transientTabCursorsById,
        recentWorkspacePaths: [],
        persistRevision,
        lastPersistedRevision,
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
        replaceWorkspaceExecutionHistory: vi.fn(),
        setErrorMessage: vi.fn(),
        clearErrorMessage: vi.fn(),
        ...restOverrides,
    };
}

async function createEditorStore(overrides: Partial<WorkspaceStore> = {}) {
    const { createWorkspaceEditorSlice } = await import(
        "./createWorkspaceEditorSlice"
    );

    let state = createWorkspaceStoreState(overrides);

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
    const slice = createWorkspaceEditorSlice(
        setState as Parameters<typeof createWorkspaceEditorSlice>[0],
        getState as Parameters<typeof createWorkspaceEditorSlice>[1],
        {} as Parameters<typeof createWorkspaceEditorSlice>[2],
    );

    state = {
        ...state,
        ...slice,
    };

    return {
        getState,
    };
}

describe("createWorkspaceEditorSlice", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        mocks.saveWorkspaceFile.mockReset();
    });

    it("stores cursor moves in transient state without rebuilding the workspace", async () => {
        const store = await createEditorStore({
            persistRevision: 4,
            lastPersistedRevision: 2,
        });
        const previousWorkspace = store.getState().workspace;

        store.getState().updateActiveTabCursor({
            line: 3,
            column: 7,
            scrollTop: 96,
        });

        expect(store.getState().workspace).toBe(previousWorkspace);
        expect(store.getState().persistRevision).toBe(4);
        expect(store.getState().lastPersistedRevision).toBe(2);
        expect(store.getState().transientTabCursorsById).toEqual({
            "tab-1": {
                line: 0,
                column: 7,
                scrollTop: 96,
            },
        });
    });

    it("stores scroll updates in transient state without rebuilding the workspace", async () => {
        const store = await createEditorStore({
            persistRevision: 6,
            lastPersistedRevision: 6,
        });
        const previousWorkspace = store.getState().workspace;

        store.getState().updateActiveTabScrollTop(240);

        expect(store.getState().workspace).toBe(previousWorkspace);
        expect(store.getState().persistRevision).toBe(6);
        expect(store.getState().lastPersistedRevision).toBe(6);
        expect(store.getState().transientTabCursorsById).toEqual({
            "tab-1": {
                line: 0,
                column: 0,
                scrollTop: 240,
            },
        });
    });

    it("uses the transient cursor when saving and clears it afterward", async () => {
        const store = await createEditorStore({
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
            transientTabCursorsById: {
                "tab-1": {
                    line: 5,
                    column: 2,
                    scrollTop: 180,
                },
            },
        });

        mocks.saveWorkspaceFile.mockResolvedValue(undefined);

        await store.getState().saveActiveWorkspaceTab();

        expect(mocks.saveWorkspaceFile).toHaveBeenCalledWith({
            workspacePath: "/workspace/current",
            tabId: "tab-1",
            content: "print('draft')",
            cursor: {
                line: 0,
                column: 2,
                scrollTop: 180,
            },
        });
        expect(store.getState().workspace?.tabs[0]).toMatchObject({
            savedContent: "print('draft')",
            cursor: {
                line: 0,
                column: 2,
                scrollTop: 180,
            },
        });
        expect(store.getState().dirtyTabCount).toBe(0);
        expect(store.getState().transientTabCursorsById).toEqual({});
    });
});
