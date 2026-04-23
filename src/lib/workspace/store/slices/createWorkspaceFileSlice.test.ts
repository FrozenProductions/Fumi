import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { WorkspaceStore } from "../workspaceStore.type";

const mocks = vi.hoisted(() => ({
    confirmAction: vi.fn(),
    createWorkspaceFile: vi.fn(),
    deleteWorkspaceFile: vi.fn(),
    importWorkspaceFile: vi.fn(),
    renameWorkspaceFile: vi.fn(),
}));

vi.mock("../../../platform/dialog", () => ({
    confirmAction: mocks.confirmAction,
}));

vi.mock("../../../platform/workspace", () => ({
    createWorkspaceFile: mocks.createWorkspaceFile,
    deleteWorkspaceFile: mocks.deleteWorkspaceFile,
    importWorkspaceFile: mocks.importWorkspaceFile,
    renameWorkspaceFile: mocks.renameWorkspaceFile,
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
        ...restOverrides,
    };
}

async function createFileStore(overrides: Partial<WorkspaceStore> = {}) {
    const { createWorkspaceFileSlice } = await import(
        "./createWorkspaceFileSlice"
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
        mocks.importWorkspaceFile.mockReset();
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
        expect(store.getState().persistRevision).toBe(1);
        expect(store.getState().lastPersistedRevision).toBe(1);
    });

    it("imports dropped lua files in order and activates the last imported tab", async () => {
        const store = await createFileStore();

        mocks.importWorkspaceFile
            .mockResolvedValueOnce({
                fileName: "beta.lua",
                content: "print('beta')",
            })
            .mockResolvedValueOnce({
                fileName: "gamma.luau",
                content: "print('gamma')",
            });
        mocks.createWorkspaceFile
            .mockResolvedValueOnce({
                id: "tab-2",
                fileName: "beta.lua",
                content: "print('beta')",
                isDirty: false,
                cursor: {
                    line: 0,
                    column: 0,
                    scrollTop: 0,
                },
            })
            .mockResolvedValueOnce({
                id: "tab-3",
                fileName: "gamma.luau",
                content: "print('gamma')",
                isDirty: false,
                cursor: {
                    line: 0,
                    column: 0,
                    scrollTop: 0,
                },
            });

        await expect(
            store
                .getState()
                .importDroppedWorkspaceFiles([
                    "/tmp/beta.lua",
                    "/tmp/gamma.luau",
                ]),
        ).resolves.toBe(true);

        expect(mocks.importWorkspaceFile).toHaveBeenNthCalledWith(1, {
            filePath: "/tmp/beta.lua",
        });
        expect(mocks.importWorkspaceFile).toHaveBeenNthCalledWith(2, {
            filePath: "/tmp/gamma.luau",
        });
        expect(mocks.createWorkspaceFile).toHaveBeenNthCalledWith(1, {
            workspacePath: "/workspace/current",
            fileName: "beta.lua",
            initialContent: "print('beta')",
        });
        expect(mocks.createWorkspaceFile).toHaveBeenNthCalledWith(2, {
            workspacePath: "/workspace/current",
            fileName: "gamma.luau",
            initialContent: "print('gamma')",
        });
        expect(store.getState().workspace?.activeTabId).toBe("tab-3");
        expect(store.getState().errorMessage).toBeNull();
    });

    it("sets an error when dropped scripts are imported without an open workspace", async () => {
        const store = await createFileStore({
            workspace: null,
        });

        await expect(
            store.getState().importDroppedWorkspaceFiles(["/tmp/beta.lua"]),
        ).resolves.toBe(false);

        expect(store.getState().errorMessage).toBe(
            "Choose a workspace before importing dropped scripts.",
        );
        expect(mocks.importWorkspaceFile).not.toHaveBeenCalled();
    });

    it("sets an error when no dropped files have a supported luau extension", async () => {
        const store = await createFileStore();

        await expect(
            store
                .getState()
                .importDroppedWorkspaceFiles([
                    "/tmp/notes.txt",
                    "/tmp/archive.json",
                ]),
        ).resolves.toBe(false);

        expect(store.getState().errorMessage).toBe(
            "Drop one or more .lua or .luau files to import them into the workspace.",
        );
        expect(mocks.importWorkspaceFile).not.toHaveBeenCalled();
    });

    it("stops importing after the first import command failure", async () => {
        const store = await createFileStore();

        mocks.importWorkspaceFile
            .mockResolvedValueOnce({
                fileName: "beta.lua",
                content: "print('beta')",
            })
            .mockRejectedValueOnce(new Error("Could not read file."));
        mocks.createWorkspaceFile.mockResolvedValueOnce({
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

        await expect(
            store
                .getState()
                .importDroppedWorkspaceFiles([
                    "/tmp/beta.lua",
                    "/tmp/gamma.luau",
                    "/tmp/delta.lua",
                ]),
        ).resolves.toBe(false);

        expect(mocks.importWorkspaceFile).toHaveBeenCalledTimes(2);
        expect(mocks.createWorkspaceFile).toHaveBeenCalledTimes(1);
        expect(store.getState().errorMessage).toBe("Could not read file.");
        expect(store.getState().workspace?.activeTabId).toBe("tab-2");
    });

    it("stops importing after the first add-tab failure", async () => {
        const store = await createFileStore();

        mocks.importWorkspaceFile
            .mockResolvedValueOnce({
                fileName: "beta.lua",
                content: "print('beta')",
            })
            .mockResolvedValueOnce({
                fileName: "gamma.lua",
                content: "print('gamma')",
            });
        mocks.createWorkspaceFile
            .mockResolvedValueOnce({
                id: "tab-2",
                fileName: "beta.lua",
                content: "print('beta')",
                isDirty: false,
                cursor: {
                    line: 0,
                    column: 0,
                    scrollTop: 0,
                },
            })
            .mockRejectedValueOnce(new Error("Create failed."));

        await expect(
            store
                .getState()
                .importDroppedWorkspaceFiles([
                    "/tmp/beta.lua",
                    "/tmp/gamma.lua",
                    "/tmp/delta.lua",
                ]),
        ).resolves.toBe(false);

        expect(mocks.importWorkspaceFile).toHaveBeenCalledTimes(2);
        expect(mocks.createWorkspaceFile).toHaveBeenCalledTimes(2);
        expect(store.getState().errorMessage).toBe("Create failed.");
        expect(store.getState().workspace?.activeTabId).toBe("tab-2");
    });
});
