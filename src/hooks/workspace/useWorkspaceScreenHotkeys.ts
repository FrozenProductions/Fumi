import type { RegisterableHotkey } from "@tanstack/hotkeys";
import { useHotkey } from "@tanstack/react-hotkeys";
import { getAppHotkeyBinding } from "../../lib/app/hotkeys/hotkeys";
import type {
    AppHotkeyAction,
    AppHotkeyBinding,
    AppHotkeyBindings,
} from "../../lib/app/hotkeys/hotkeys.type";

const DISABLED_HOTKEY_PLACEHOLDER: RegisterableHotkey = {
    key: "F13",
    mod: false,
    ctrl: false,
    alt: false,
    shift: false,
};

function toHotkeyOrPlaceholder(
    binding: AppHotkeyBinding | null,
): RegisterableHotkey {
    return binding ?? DISABLED_HOTKEY_PLACEHOLDER;
}

type UseWorkspaceScreenHotkeysOptions = {
    hotkeyBindings: AppHotkeyBindings;
    disabledHotkeys?: AppHotkeyAction[];
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
    disabledHotkeys = [],
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
        disabledHotkeys,
    );
    const killRobloxHotkey = getAppHotkeyBinding(
        "KILL_ROBLOX",
        hotkeyBindings,
        disabledHotkeys,
    );
    const toggleOutlinePanelHotkey = getAppHotkeyBinding(
        "TOGGLE_OUTLINE_PANEL",
        hotkeyBindings,
        disabledHotkeys,
    );

    useHotkey(
        toHotkeyOrPlaceholder(launchRobloxHotkey),
        () => {
            void onLaunchRoblox();
        },
        {
            enabled:
                isDesktopShell &&
                !isCommandPaletteOpen &&
                !isLaunching &&
                launchRobloxHotkey !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(killRobloxHotkey),
        () => {
            void onConfirmKillRoblox();
        },
        {
            enabled:
                isDesktopShell &&
                !isCommandPaletteOpen &&
                !isKillingRoblox &&
                killingRobloxProcessPid === null &&
                killRobloxHotkey !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(toggleOutlinePanelHotkey),
        () => {
            onToggleOutlinePanel();
        },
        {
            enabled: !isCommandPaletteOpen && toggleOutlinePanelHotkey !== null,
        },
    );
}
