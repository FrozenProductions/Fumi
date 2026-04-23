import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { getCommandCommandPaletteItems } from "../commandPalette";
import { createCommandPaletteOptions } from "../commandPaletteTestUtils";

const platformMocks = vi.hoisted(() => ({
    confirmAction: vi.fn().mockResolvedValue(true),
    isTauriEnvironment: vi.fn(() => true),
    killRobloxProcesses: vi.fn().mockResolvedValue(undefined),
    launchRoblox: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../platform/accounts", () => ({
    killRobloxProcesses: platformMocks.killRobloxProcesses,
    launchRoblox: platformMocks.launchRoblox,
}));

vi.mock("../../../platform/dialog", () => ({
    confirmAction: platformMocks.confirmAction,
}));

vi.mock("../../../platform/runtime", () => ({
    isTauriEnvironment: platformMocks.isTauriEnvironment,
}));

beforeEach(() => {
    platformMocks.confirmAction.mockReset();
    platformMocks.confirmAction.mockResolvedValue(true);
    platformMocks.isTauriEnvironment.mockReset();
    platformMocks.isTauriEnvironment.mockReturnValue(true);
    platformMocks.killRobloxProcesses.mockReset();
    platformMocks.killRobloxProcesses.mockResolvedValue(undefined);
    platformMocks.launchRoblox.mockReset();
    platformMocks.launchRoblox.mockResolvedValue(undefined);
});

describe("Roblox command palette commands", () => {
    it("adds desktop Roblox commands with hotkey metadata", () => {
        platformMocks.isTauriEnvironment.mockReturnValue(true);

        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions(),
        );

        expect(items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: "command-launch-roblox",
                    meta: "Mod+Shift+L",
                    isDisabled: false,
                }),
                expect.objectContaining({
                    id: "command-kill-roblox",
                    meta: "Mod+Shift+K",
                    isDisabled: false,
                }),
            ]),
        );
    });

    it("disables Roblox commands outside the desktop shell", () => {
        platformMocks.isTauriEnvironment.mockReturnValue(false);

        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions(),
        );

        expect(
            items.find((item) => item.id === "command-launch-roblox"),
        ).toMatchObject({
            isDisabled: true,
            description: "Roblox controls require the Tauri desktop shell.",
        });
        expect(
            items.find((item) => item.id === "command-kill-roblox"),
        ).toMatchObject({
            isDisabled: true,
            description: "Roblox controls require the Tauri desktop shell.",
        });
    });

    it("launches Roblox and confirms before killing Roblox", async () => {
        platformMocks.isTauriEnvironment.mockReturnValue(true);
        platformMocks.confirmAction.mockResolvedValue(true);

        const onOpenWorkspaceScreen = vi.fn();
        const items = getCommandCommandPaletteItems(
            createCommandPaletteOptions({
                onOpenWorkspaceScreen,
            }),
        );
        const launchItem = items.find(
            (item) => item.id === "command-launch-roblox",
        );
        const killItem = items.find(
            (item) => item.id === "command-kill-roblox",
        );

        launchItem?.onSelect();
        killItem?.onSelect();
        await Promise.resolve();

        expect(onOpenWorkspaceScreen).toHaveBeenCalledTimes(2);
        expect(platformMocks.launchRoblox).toHaveBeenCalledOnce();
        expect(platformMocks.confirmAction).toHaveBeenCalledWith(
            "Attempt to close Roblox?",
        );
        expect(platformMocks.killRobloxProcesses).toHaveBeenCalledOnce();
    });
});
