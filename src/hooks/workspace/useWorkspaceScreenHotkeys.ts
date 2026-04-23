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

/**
 * Registers workspace-screen-level hotkeys for Roblox controls and the outline panel.
 *
 * @remarks
 * Disables all hotkeys while the command palette is open. Desktop-only hotkeys
 * (launch and kill Roblox) are further gated by `isDesktopShell` and their
 * respective operation-in-progress flags.
 *
 * @param options - Hotkey configuration and action callbacks
 * @returns void (side-effect only)
 */
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
