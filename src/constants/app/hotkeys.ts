import { createAppHotkey } from "../../lib/app/hotkeys";

export const APP_HOTKEYS = {
    QUIT_APP: createAppHotkey("Mod+Q"),
    OPEN_COMMAND_PALETTE: createAppHotkey("Mod+P"),
    ACTIVATE_GOTO_LINE_COMMAND: createAppHotkey("Mod+Shift+\\"),
    OPEN_WORKSPACE_DIRECTORY: createAppHotkey("Mod+O"),
    TOGGLE_COMMAND_PALETTE_COMMANDS: createAppHotkey("Mod+1"),
    TOGGLE_COMMAND_PALETTE_WORKSPACES: createAppHotkey("Mod+2"),
    TOGGLE_SIDEBAR: createAppHotkey("Mod+B"),
    OPEN_SETTINGS: createAppHotkey("Mod+,"),
    ARCHIVE_WORKSPACE_TAB: createAppHotkey("Mod+W"),
    CREATE_WORKSPACE_FILE: createAppHotkey("Mod+T"),
    OPEN_WORKSPACE_SCREEN: createAppHotkey("Mod+Shift+W"),
    OPEN_SCRIPT_LIBRARY: createAppHotkey("Mod+Shift+S"),
    OPEN_ACCOUNTS: createAppHotkey("Mod+Shift+A"),
} as const;
