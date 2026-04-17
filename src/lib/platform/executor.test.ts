import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vite-plus/test";

const mocks = vi.hoisted(() => ({
    eventHandlers: new Map<string, (event: { payload: unknown }) => void>(),
    invoke: vi.fn(),
    isTauriEnvironment: vi.fn(() => true),
    listen: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
    invoke: mocks.invoke,
}));

vi.mock("@tauri-apps/api/event", () => ({
    listen: mocks.listen,
}));

vi.mock("./runtime", () => ({
    isTauriEnvironment: mocks.isTauriEnvironment,
}));

async function loadExecutorModule(): Promise<typeof import("./executor")> {
    return import("./executor");
}

function createExecutorStatusPayload(
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return {
        executorKind: "opiumware",
        availablePorts: [8392, 8393, 8394, 8395, 8396, 8397].map((port) => ({
            port,
            boundAccountId: null,
            boundAccountDisplayName: null,
            isBoundToUnknownAccount: false,
        })),
        port: 8394,
        isAttached: true,
        ...overrides,
    };
}

describe("executor platform commands", () => {
    beforeEach(() => {
        mocks.eventHandlers.clear();
        mocks.invoke.mockReset();
        mocks.listen.mockReset();
        mocks.isTauriEnvironment.mockReset();
        mocks.isTauriEnvironment.mockReturnValue(true);
        mocks.listen.mockImplementation(
            async (
                event: string,
                handler: (event: { payload: unknown }) => void,
            ) => {
                mocks.eventHandlers.set(event, handler);
                return vi.fn();
            },
        );
    });

    afterEach(() => {
        vi.resetModules();
    });

    it("decodes the extended executor status payload", async () => {
        const executorModule = await loadExecutorModule();
        mocks.invoke.mockResolvedValue(createExecutorStatusPayload());

        await expect(executorModule.getExecutorStatus()).resolves.toEqual(
            createExecutorStatusPayload(),
        );
        expect(mocks.invoke).toHaveBeenCalledWith(
            "get_executor_status",
            undefined,
        );
    });

    it("rejects malformed status payloads instead of returning invalid executor state", async () => {
        const executorModule = await loadExecutorModule();
        mocks.invoke.mockResolvedValue({
            executorKind: "macsploit",
            availablePorts: "5553,5554",
            port: 5553,
            isAttached: false,
        });

        await expect(executorModule.getExecutorStatus()).rejects.toHaveProperty(
            "message",
            "Unexpected response shape for getExecutorStatus.",
        );
    });

    it("subscribes to executor events and forwards backend payloads", async () => {
        const executorModule = await loadExecutorModule();
        const handleMessage = vi.fn();
        const handleStatusChanged = vi.fn();

        await executorModule.subscribeToExecutorMessages(handleMessage);
        await executorModule.subscribeToExecutorStatusChanged(
            handleStatusChanged,
        );

        mocks.eventHandlers.get("executor://message")?.({
            payload: {
                kind: "stdout",
                text: "print('hello')",
            },
        });
        mocks.eventHandlers.get("executor://status-changed")?.({
            payload: createExecutorStatusPayload(),
        });

        expect(mocks.listen).toHaveBeenNthCalledWith(
            1,
            "executor://message",
            expect.any(Function),
        );
        expect(mocks.listen).toHaveBeenNthCalledWith(
            2,
            "executor://status-changed",
            expect.any(Function),
        );
        expect(handleMessage).toHaveBeenCalledWith({
            kind: "stdout",
            text: "print('hello')",
        });
        expect(handleStatusChanged).toHaveBeenCalledWith(
            createExecutorStatusPayload(),
        );
    });

    it("returns a safe browser fallback outside the desktop shell", async () => {
        mocks.isTauriEnvironment.mockReturnValue(false);
        const executorModule = await loadExecutorModule();

        await expect(executorModule.getExecutorStatus()).resolves.toEqual({
            executorKind: "macsploit",
            availablePorts: [
                5553, 5554, 5555, 5556, 5557, 5558, 5559, 5560, 5561, 5562,
            ].map((port) => ({
                port,
                boundAccountId: null,
                boundAccountDisplayName: null,
                isBoundToUnknownAccount: false,
            })),
            port: 5553,
            isAttached: false,
        });
        await expect(
            executorModule.subscribeToExecutorStatusChanged(vi.fn()),
        ).resolves.toEqual(expect.any(Function));
        expect(mocks.invoke).not.toHaveBeenCalled();
        expect(mocks.listen).not.toHaveBeenCalled();
    });
});
