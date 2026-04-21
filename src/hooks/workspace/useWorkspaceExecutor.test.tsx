import type { ReactElement } from "react";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vite-plus/test";
import { useWorkspaceExecutor } from "./useWorkspaceExecutor";
import type {
    UseWorkspaceExecutorOptions,
    UseWorkspaceExecutorResult,
} from "./useWorkspaceExecutor.type";

const mocks = vi.hoisted(() => ({
    appendWorkspaceExecutionHistory: vi.fn(),
    attachExecutor: vi.fn(),
    detachExecutor: vi.fn(),
    executeExecutorScript: vi.fn(),
    getExecutorStatus: vi.fn(),
    subscribeToExecutorStatusChanged: vi.fn(),
}));

vi.mock("../../lib/platform/executor", () => ({
    attachExecutor: mocks.attachExecutor,
    detachExecutor: mocks.detachExecutor,
    executeExecutorScript: mocks.executeExecutorScript,
    getExecutorStatus: mocks.getExecutorStatus,
    subscribeToExecutorStatusChanged: mocks.subscribeToExecutorStatusChanged,
}));

vi.mock("../../lib/platform/workspace", () => ({
    appendWorkspaceExecutionHistory: mocks.appendWorkspaceExecutionHistory,
}));

function createExecutorStatus() {
    return {
        executorKind: "macsploit" as const,
        availablePorts: [
            {
                port: 5553,
                boundAccountId: "account-1",
                boundAccountDisplayName: "Main",
                isBoundToUnknownAccount: false,
            },
        ],
        port: 5553,
        isAttached: true,
    };
}

function HookHarness(props: {
    options: UseWorkspaceExecutorOptions;
    onResult: (result: UseWorkspaceExecutorResult) => void;
}): ReactElement | null {
    const result = useWorkspaceExecutor(props.options);

    useEffect(() => {
        props.onResult(result);
    }, [props.onResult, result]);

    return null;
}

async function flushAsyncWork(): Promise<void> {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
}

describe("useWorkspaceExecutor", () => {
    let container: HTMLDivElement;
    let root: ReturnType<typeof createRoot>;
    let latestResult: UseWorkspaceExecutorResult | null = null;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.append(container);
        root = createRoot(container);
        latestResult = null;
        mocks.appendWorkspaceExecutionHistory.mockReset();
        mocks.attachExecutor.mockReset();
        mocks.detachExecutor.mockReset();
        mocks.executeExecutorScript.mockReset();
        mocks.getExecutorStatus.mockReset();
        mocks.subscribeToExecutorStatusChanged.mockReset();
        mocks.getExecutorStatus.mockResolvedValue(createExecutorStatus());
        mocks.subscribeToExecutorStatusChanged.mockResolvedValue(
            () => undefined,
        );
        vi.spyOn(Date, "now").mockReturnValue(1_234);
        vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
            "00000000-0000-4000-8000-000000000000",
        );
    });

    afterEach(() => {
        root.unmount();
        container.remove();
        vi.restoreAllMocks();
    });

    async function renderHook(
        options: UseWorkspaceExecutorOptions,
    ): Promise<UseWorkspaceExecutorResult> {
        await act(async () => {
            root.render(
                <HookHarness
                    options={options}
                    onResult={(result) => {
                        latestResult = result;
                    }}
                />,
            );
        });
        await flushAsyncWork();

        if (!latestResult) {
            throw new Error("Expected executor hook result");
        }

        return latestResult;
    }

    it("records the active tab snapshot, account info, and port after a successful execute", async () => {
        const onExecutionHistoryUpdated = vi.fn();
        const executionHistory = [
            {
                id: "history-id",
                executedAt: 1_234,
                executorKind: "macsploit",
                port: 5553,
                accountId: "account-1",
                accountDisplayName: "Main",
                isBoundToUnknownAccount: false,
                fileName: "alpha.lua",
                scriptContent: "print('alpha')",
            },
        ];
        mocks.executeExecutorScript.mockResolvedValue(undefined);
        mocks.appendWorkspaceExecutionHistory.mockResolvedValue(
            executionHistory,
        );
        const result = await renderHook({
            workspacePath: "/workspace/current",
            activeTab: {
                fileName: "alpha.lua",
                content: "print('alpha')",
            },
            onExecutionHistoryUpdated,
        });

        await act(async () => {
            await result.actions.executeActiveTab();
        });

        expect(mocks.executeExecutorScript).toHaveBeenCalledWith(
            "print('alpha')",
        );
        expect(mocks.appendWorkspaceExecutionHistory).toHaveBeenCalledWith({
            workspacePath: "/workspace/current",
            entry: {
                id: "00000000-0000-4000-8000-000000000000",
                executedAt: 1_234,
                executorKind: "macsploit",
                port: 5553,
                accountId: "account-1",
                accountDisplayName: "Main",
                isBoundToUnknownAccount: false,
                fileName: "alpha.lua",
                scriptContent: "print('alpha')",
            },
        });
        expect(onExecutionHistoryUpdated).toHaveBeenCalledWith(
            "/workspace/current",
            executionHistory,
        );
    });

    it("re-runs a stored history entry and records a fresh execution entry", async () => {
        mocks.executeExecutorScript.mockResolvedValue(undefined);
        mocks.appendWorkspaceExecutionHistory.mockResolvedValue([]);
        const result = await renderHook({
            workspacePath: "/workspace/current",
            activeTab: null,
        });
        const entry = {
            id: "old-history",
            executedAt: 12,
            executorKind: "opiumware" as const,
            port: 8394,
            accountId: null,
            accountDisplayName: null,
            isBoundToUnknownAccount: false,
            fileName: "stored.lua",
            scriptContent: "print('stored')",
        };

        await act(async () => {
            await result.actions.executeHistoryEntry(entry);
        });

        expect(mocks.executeExecutorScript).toHaveBeenCalledWith(
            "print('stored')",
        );
        expect(mocks.appendWorkspaceExecutionHistory).toHaveBeenCalledWith({
            workspacePath: "/workspace/current",
            entry: expect.objectContaining({
                id: "00000000-0000-4000-8000-000000000000",
                fileName: "stored.lua",
                scriptContent: "print('stored')",
                executorKind: "macsploit",
                port: 5553,
            }),
        });
    });

    it("shows a non-fatal warning when history append fails after execute succeeds", async () => {
        mocks.executeExecutorScript.mockResolvedValue(undefined);
        mocks.appendWorkspaceExecutionHistory.mockRejectedValue(
            new Error("write failed"),
        );
        await renderHook({
            workspacePath: "/workspace/current",
            activeTab: {
                fileName: "alpha.lua",
                content: "print('alpha')",
            },
        });

        await act(async () => {
            await latestResult?.actions.executeActiveTab();
        });
        await flushAsyncWork();

        expect(latestResult?.state.errorMessage).toBe(
            "Executed script, but could not save execution history.",
        );
    });
});
