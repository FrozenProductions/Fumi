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

async function loadAccountsModule(): Promise<typeof import("./accounts")> {
    return import("./accounts");
}

function createAccountSummary(
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return {
        id: "account-1",
        userId: 42,
        username: "cool-user",
        displayName: "Cool User",
        avatarUrl: "https://cdn.test/42.png",
        status: "offline",
        boundPort: null,
        lastLaunchedAt: null,
        ...overrides,
    };
}

describe("accounts platform commands", () => {
    beforeEach(() => {
        mocks.invoke.mockReset();
        mocks.isTauriEnvironment.mockReset();
        mocks.isTauriEnvironment.mockReturnValue(true);
    });

    afterEach(() => {
        vi.resetModules();
    });

    it("returns an empty list outside the desktop shell", async () => {
        mocks.isTauriEnvironment.mockReturnValue(false);
        const accountsModule = await loadAccountsModule();

        await expect(accountsModule.listAccounts()).resolves.toEqual({
            accounts: [],
            isRobloxRunning: false,
        });
        expect(mocks.invoke).not.toHaveBeenCalled();
    });

    it("invokes add and launch commands with typed payloads", async () => {
        const accountsModule = await loadAccountsModule();
        mocks.invoke
            .mockResolvedValueOnce(createAccountSummary())
            .mockResolvedValueOnce(
                createAccountSummary({
                    status: "active",
                    boundPort: 5553,
                    lastLaunchedAt: 123,
                }),
            );

        await expect(
            accountsModule.addAccount("cookie-value"),
        ).resolves.toEqual(createAccountSummary());
        await expect(
            accountsModule.launchAccount("account-1"),
        ).resolves.toEqual(
            createAccountSummary({
                status: "active",
                boundPort: 5553,
                lastLaunchedAt: 123,
            }),
        );

        expect(mocks.invoke).toHaveBeenNthCalledWith(1, "add_account", {
            cookie: "cookie-value",
        });
        expect(mocks.invoke).toHaveBeenNthCalledWith(2, "launch_account", {
            accountId: "account-1",
        });
    });

    it("rejects shell-only account mutations outside the desktop shell", async () => {
        mocks.isTauriEnvironment.mockReturnValue(false);
        const accountsModule = await loadAccountsModule();

        await expect(
            accountsModule.addAccount("cookie-value"),
        ).rejects.toHaveProperty(
            "message",
            "Accounts commands require the Tauri desktop shell.",
        );
        await expect(
            accountsModule.launchAccount("account-1"),
        ).rejects.toHaveProperty(
            "message",
            "Accounts commands require the Tauri desktop shell.",
        );
        await expect(
            accountsModule.deleteAccount("account-1"),
        ).rejects.toHaveProperty(
            "message",
            "Accounts commands require the Tauri desktop shell.",
        );

        expect(mocks.invoke).not.toHaveBeenCalled();
    });

    it("rejects malformed backend payloads instead of returning invalid account data", async () => {
        const accountsModule = await loadAccountsModule();
        mocks.invoke.mockResolvedValue({
            id: "account-1",
            userId: "42",
        });

        await expect(
            accountsModule.addAccount("cookie-value"),
        ).rejects.toHaveProperty(
            "message",
            "Unexpected response shape for addAccount.",
        );
    });
});
