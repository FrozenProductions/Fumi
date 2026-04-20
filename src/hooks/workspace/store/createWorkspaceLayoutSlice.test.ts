import { describe, expect, it, vi } from "vite-plus/test";
import { createWorkspaceLayoutSlice } from "./createWorkspaceLayoutSlice";
import type { WorkspaceStore } from "./workspaceStore.type";

function createWorkspaceStoreState(): WorkspaceStore {
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
                    content: "print('alpha')",
                    savedContent: "print('alpha')",
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
                    content: "print('beta')",
                    savedContent: "print('beta')",
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
        persistRevision: 0,
        lastPersistedRevision: 0,
        isBootstrapping: false,
        isHydrated: true,
        errorMessage: null,
        bootstrapWorkspaceSession: vi.fn(),
        persistWorkspaceState: vi.fn(async () => true),
        refreshWorkspaceFromFilesystem: vi.fn(),
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

function createLayoutStore() {
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
    const slice = createWorkspaceLayoutSlice(
        setState as Parameters<typeof createWorkspaceLayoutSlice>[0],
        getState as Parameters<typeof createWorkspaceLayoutSlice>[1],
        {} as Parameters<typeof createWorkspaceLayoutSlice>[2],
    );

    state = {
        ...state,
        ...slice,
    };

    return {
        getState,
    };
}

describe("createWorkspaceLayoutSlice", () => {
    it("persists only when selecting a different tab", () => {
        const store = createLayoutStore();

        store.getState().selectWorkspaceTab("tab-2");
        store.getState().selectWorkspaceTab("tab-2");

        expect(store.getState().workspace?.activeTabId).toBe("tab-2");
        expect(store.getState().persistWorkspaceState).toHaveBeenCalledTimes(1);
    });
});
