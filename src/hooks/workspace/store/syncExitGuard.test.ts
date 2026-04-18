import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createWorkspaceExitGuardSync } from "./syncExitGuard";
import type { WorkspaceStore } from "./workspaceStore.type";

const mocks = vi.hoisted(() => ({
    setWorkspaceUnsavedChanges: vi.fn(),
}));

vi.mock("../../../lib/platform/workspace", () => ({
    setWorkspaceUnsavedChanges: mocks.setWorkspaceUnsavedChanges,
}));

function createWorkspaceStoreState(hasUnsavedChanges: boolean): WorkspaceStore {
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
                    fileName: "script.lua",
                    content: hasUnsavedChanges ? "draft" : "saved",
                    savedContent: "saved",
                    isDirty: hasUnsavedChanges,
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
    } as unknown as WorkspaceStore;
}

async function flushAsyncWork(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe("syncWorkspaceExitGuard", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        mocks.setWorkspaceUnsavedChanges.mockReset();
    });

    it("only syncs when the derived guard state changes", async () => {
        const syncWorkspaceExitGuard = createWorkspaceExitGuardSync();

        mocks.setWorkspaceUnsavedChanges.mockResolvedValue(undefined);

        syncWorkspaceExitGuard(createWorkspaceStoreState(false));
        syncWorkspaceExitGuard(createWorkspaceStoreState(false));
        syncWorkspaceExitGuard(createWorkspaceStoreState(true));
        syncWorkspaceExitGuard(createWorkspaceStoreState(true));

        await flushAsyncWork();

        expect(mocks.setWorkspaceUnsavedChanges).toHaveBeenCalledTimes(2);
        expect(mocks.setWorkspaceUnsavedChanges).toHaveBeenNthCalledWith(
            1,
            false,
        );
        expect(mocks.setWorkspaceUnsavedChanges).toHaveBeenNthCalledWith(
            2,
            true,
        );
    });

    it("ignores stale failures and retries after the latest failure", async () => {
        const syncWorkspaceExitGuard = createWorkspaceExitGuardSync();
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);

        let rejectFirstRequest: ((error?: unknown) => void) | undefined;
        let rejectLatestRequest: ((error?: unknown) => void) | undefined;

        mocks.setWorkspaceUnsavedChanges
            .mockImplementationOnce(
                () =>
                    new Promise<void>((_, reject) => {
                        rejectFirstRequest = reject;
                    }),
            )
            .mockResolvedValueOnce(undefined)
            .mockImplementationOnce(
                () =>
                    new Promise<void>((_, reject) => {
                        rejectLatestRequest = reject;
                    }),
            )
            .mockResolvedValueOnce(undefined);

        syncWorkspaceExitGuard(createWorkspaceStoreState(false));
        syncWorkspaceExitGuard(createWorkspaceStoreState(true));

        if (rejectFirstRequest) {
            rejectFirstRequest(new Error("stale failure"));
        }
        await flushAsyncWork();

        syncWorkspaceExitGuard(createWorkspaceStoreState(true));

        expect(mocks.setWorkspaceUnsavedChanges).toHaveBeenCalledTimes(2);

        syncWorkspaceExitGuard(createWorkspaceStoreState(false));
        if (rejectLatestRequest) {
            rejectLatestRequest(new Error("latest failure"));
        }
        await flushAsyncWork();

        syncWorkspaceExitGuard(createWorkspaceStoreState(false));
        await flushAsyncWork();

        expect(mocks.setWorkspaceUnsavedChanges).toHaveBeenCalledTimes(4);
        expect(errorSpy).toHaveBeenCalledOnce();
    });
});
