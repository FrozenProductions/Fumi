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
}));

vi.mock("@tauri-apps/api/core", () => ({
    invoke: mocks.invoke,
}));

vi.mock("./runtime", () => ({
    isTauriEnvironment: mocks.isTauriEnvironment,
}));

async function loadAutomaticExecutionModule(): Promise<
    typeof import("./automaticExecution")
> {
    return import("./automaticExecution");
}

function createSnapshotPayload(
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return {
        executorKind: "opiumware",
        resolvedPath: "/Users/dayte/Opiumware/autoexec",
        metadata: {
            version: 1,
            activeScriptId: "script-1",
            scripts: [
                {
                    id: "script-1",
                    fileName: "autoexec.lua",
                    cursor: {
                        line: 4,
                        column: 2,
                        scrollTop: 18,
                    },
                },
            ],
        },
        scripts: [
            {
                id: "script-1",
                fileName: "autoexec.lua",
                cursor: {
                    line: 4,
                    column: 2,
                    scrollTop: 18,
                },
                content: "print('hi')",
                isDirty: false,
            },
        ],
        ...overrides,
    };
}

describe("automatic execution platform commands", () => {
    beforeEach(() => {
        mocks.invoke.mockReset();
        mocks.isTauriEnvironment.mockReset();
        mocks.isTauriEnvironment.mockReturnValue(true);
    });

    afterEach(() => {
        vi.resetModules();
    });

    it("decodes automatic execution snapshots", async () => {
        const automaticExecutionModule = await loadAutomaticExecutionModule();
        mocks.invoke.mockResolvedValue(createSnapshotPayload());

        await expect(
            automaticExecutionModule.bootstrapAutomaticExecution("opiumware"),
        ).resolves.toEqual(createSnapshotPayload());
        expect(mocks.invoke).toHaveBeenCalledWith(
            "bootstrap_automatic_execution",
            {
                executorKind: "opiumware",
            },
        );
    });

    it("rejects malformed automatic execution payloads", async () => {
        const automaticExecutionModule = await loadAutomaticExecutionModule();
        mocks.invoke.mockResolvedValue({
            executorKind: "opiumware",
            resolvedPath: "/Users/dayte/Opiumware/autoexec",
            metadata: {
                version: 1,
                activeScriptId: null,
                scripts: "bad",
            },
            scripts: [],
        });

        await expect(
            automaticExecutionModule.refreshAutomaticExecution("opiumware"),
        ).rejects.toHaveProperty(
            "message",
            "Unexpected response shape for refreshAutomaticExecution.",
        );
    });

    it("rejects desktop-only commands outside the shell", async () => {
        mocks.isTauriEnvironment.mockReturnValue(false);
        const automaticExecutionModule = await loadAutomaticExecutionModule();

        await expect(
            automaticExecutionModule.bootstrapAutomaticExecution("macsploit"),
        ).rejects.toHaveProperty(
            "message",
            "Automatic execution commands require the Tauri desktop shell.",
        );
        await expect(
            automaticExecutionModule.persistAutomaticExecutionState({
                executorKind: "macsploit",
                activeScriptId: null,
                scripts: [],
            }),
        ).resolves.toBeUndefined();
        expect(mocks.invoke).not.toHaveBeenCalled();
    });
});
