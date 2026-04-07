import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vite-plus/test";

const mocks = vi.hoisted(() => ({
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

describe("executor platform commands", () => {
    beforeEach(() => {
        mocks.invoke.mockReset();
        mocks.listen.mockReset();
        mocks.isTauriEnvironment.mockReset();
        mocks.isTauriEnvironment.mockReturnValue(true);
    });

    afterEach(() => {
        vi.resetModules();
    });

    it("decodes the extended executor status payload", async () => {
        const executorModule = await loadExecutorModule();
        mocks.invoke.mockResolvedValue({
            executorKind: "opiumware",
            availablePorts: [8392, 8393, 8394, 8395, 8396, 8397],
            port: 8394,
            isAttached: true,
        });

        await expect(executorModule.getExecutorStatus()).resolves.toEqual({
            executorKind: "opiumware",
            availablePorts: [8392, 8393, 8394, 8395, 8396, 8397],
            port: 8394,
            isAttached: true,
        });
        expect(mocks.invoke).toHaveBeenCalledWith(
            "get_executor_status",
            undefined,
        );
    });

    it("returns a safe browser fallback outside the desktop shell", async () => {
        mocks.isTauriEnvironment.mockReturnValue(false);
        const executorModule = await loadExecutorModule();

        await expect(executorModule.getExecutorStatus()).resolves.toEqual({
            executorKind: "macsploit",
            availablePorts: [
                5553, 5554, 5555, 5556, 5557, 5558, 5559, 5560, 5561, 5562,
            ],
            port: 5553,
            isAttached: false,
        });
        expect(mocks.invoke).not.toHaveBeenCalled();
    });
});
