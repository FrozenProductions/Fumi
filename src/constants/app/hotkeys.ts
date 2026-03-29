import type { Hotkey } from "@tanstack/hotkeys";
import { formatForDisplay } from "@tanstack/react-hotkeys";

function createHotkey<T extends Hotkey | (string & {})>(binding: T) {
    return {
        binding,
        label: formatForDisplay(binding),
    } as const;
}

export const APP_HOTKEYS = {
    QUIT_APP: createHotkey("Mod+Q"),
    OPEN_COMMAND_PALETTE: createHotkey("Mod+P"),
    ACTIVATE_GOTO_LINE_COMMAND: createHotkey("Mod+Shift+\\"),
    OPEN_WORKSPACE_DIRECTORY: createHotkey("Mod+O"),
    TOGGLE_COMMAND_PALETTE_COMMANDS: createHotkey("Mod+1"),
    TOGGLE_COMMAND_PALETTE_WORKSPACES: createHotkey("Mod+2"),
    TOGGLE_SIDEBAR: createHotkey("Mod+B"),
    OPEN_SETTINGS: createHotkey("Mod+,"),
    ARCHIVE_WORKSPACE_TAB: createHotkey("Mod+W"),
    CREATE_WORKSPACE_FILE: createHotkey("Mod+T"),
    OPEN_WORKSPACE_SCREEN: createHotkey("Mod+Shift+W"),
    OPEN_SCRIPT_LIBRARY: createHotkey("Mod+Shift+S"),
} as const;
