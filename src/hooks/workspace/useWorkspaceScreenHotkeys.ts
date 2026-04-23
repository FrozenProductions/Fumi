import { useHotkey } from "@tanstack/react-hotkeys";
import { getAppHotkeyBinding } from "../../lib/app/hotkeys/hotkeys";
import type { AppHotkeyBindings } from "../../lib/app/hotkeys/hotkeys.type";

type UseWorkspaceScreenHotkeysOptions = {
    hotkeyBindings: AppHotkeyBindings;
    isCommandPaletteOpen: boolean;
    isDesktopShell: boolean;
    isLaunching: boolean;
    isKillingRoblox: boolean;
    killingRobloxProcessPid: number | null;
    onLaunchRoblox: () => Promise<void>;
    onConfirmKillRoblox: () => Promise<void>;
    onToggleOutlinePanel: () => void;
};

export function useWorkspaceScreenHotkeys({
    hotkeyBindings,
    isCommandPaletteOpen,
    isDesktopShell,
    isLaunching,
    isKillingRoblox,
    killingRobloxProcessPid,
    onLaunchRoblox,
    onConfirmKillRoblox,
    onToggleOutlinePanel,
}: UseWorkspaceScreenHotkeysOptions): void {
    const launchRobloxHotkey = getAppHotkeyBinding(
        "LAUNCH_ROBLOX",
        hotkeyBindings,
    );
    const killRobloxHotkey = getAppHotkeyBinding("KILL_ROBLOX", hotkeyBindings);
    const toggleOutlinePanelHotkey = getAppHotkeyBinding(
        "TOGGLE_OUTLINE_PANEL",
        hotkeyBindings,
    );

    useHotkey(
        launchRobloxHotkey,
        () => {
            void onLaunchRoblox();
        },
        {
            enabled: isDesktopShell && !isCommandPaletteOpen && !isLaunching,
        },
    );

    useHotkey(
        killRobloxHotkey,
        () => {
            void onConfirmKillRoblox();
        },
        {
            enabled:
                isDesktopShell &&
                !isCommandPaletteOpen &&
                !isKillingRoblox &&
                killingRobloxProcessPid === null,
        },
    );

    useHotkey(
        toggleOutlinePanelHotkey,
        () => {
            onToggleOutlinePanel();
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );
}
