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
        });
        expect(mocks.invoke).not.toHaveBeenCalled();
    });

    it("invokes add and launch commands with typed payloads", async () => {
        const accountsModule = await loadAccountsModule();
        mocks.invoke
            .mockResolvedValueOnce({
                id: "account-1",
                userId: 42,
                username: "cool-user",
                displayName: "Cool User",
                avatarUrl: "https://cdn.test/42.png",
                status: "offline",
                lastLaunchedAt: null,
            })
            .mockResolvedValueOnce({
                id: "account-1",
                userId: 42,
                username: "cool-user",
                displayName: "Cool User",
                avatarUrl: "https://cdn.test/42.png",
                status: "active",
                lastLaunchedAt: 123,
            });

        await expect(
            accountsModule.addAccount("cookie-value"),
        ).resolves.toEqual({
            id: "account-1",
            userId: 42,
            username: "cool-user",
            displayName: "Cool User",
            avatarUrl: "https://cdn.test/42.png",
            status: "offline",
            lastLaunchedAt: null,
        });
        await expect(
            accountsModule.launchAccount("account-1"),
        ).resolves.toEqual({
            id: "account-1",
            userId: 42,
            username: "cool-user",
            displayName: "Cool User",
            avatarUrl: "https://cdn.test/42.png",
            status: "active",
            lastLaunchedAt: 123,
        });

        expect(mocks.invoke).toHaveBeenNthCalledWith(1, "add_account", {
            cookie: "cookie-value",
        });
        expect(mocks.invoke).toHaveBeenNthCalledWith(2, "launch_account", {
            accountId: "account-1",
        });
    });

    it("invokes delete_account with the expected payload", async () => {
        const accountsModule = await loadAccountsModule();
        mocks.invoke.mockResolvedValue(undefined);

        await expect(accountsModule.deleteAccount("account-1")).resolves.toBe(
            undefined,
        );

        expect(mocks.invoke).toHaveBeenCalledWith("delete_account", {
            accountId: "account-1",
        });
    });
});
