import type { AppHotkeyAction } from "../../lib/app/app.type";
import type {
    AppHotkeyDefinition,
    AppReservedHotkey,
} from "../../lib/app/hotkeys.type";

export const APP_HOTKEY_ACTIONS = [
    "QUIT_APP",
    "OPEN_COMMAND_PALETTE",
    "ACTIVATE_GOTO_LINE_COMMAND",
    "OPEN_WORKSPACE_DIRECTORY",
    "TOGGLE_COMMAND_PALETTE_COMMANDS",
    "TOGGLE_COMMAND_PALETTE_WORKSPACES",
    "TOGGLE_SIDEBAR",
    "OPEN_SETTINGS",
    "ARCHIVE_WORKSPACE_TAB",
    "CREATE_WORKSPACE_FILE",
    "OPEN_WORKSPACE_SCREEN",
    "OPEN_SCRIPT_LIBRARY",
    "OPEN_ACCOUNTS",
] as const satisfies AppHotkeyAction[];

export const APP_HOTKEY_DEFINITIONS = {
    QUIT_APP: {
        label: "Quit app",
        description: "Quit Fumi through the native app menu accelerator.",
        defaultBinding: "Mod+Q",
        groupLabel: "App",
        isEditable: false,
        isVisibleInSettings: false,
    },
    OPEN_COMMAND_PALETTE: {
        label: "Open command palette",
        description: "Open the main command palette from anywhere in the app.",
        defaultBinding: "Mod+P",
        groupLabel: "Command Palette",
        isEditable: true,
        isVisibleInSettings: true,
    },
    ACTIVATE_GOTO_LINE_COMMAND: {
        label: "Go to line",
        description:
            "Open the command palette directly in go-to-line mode for the active tab.",
        defaultBinding: {
            key: "\\",
            mod: true,
            shift: true,
        },
        groupLabel: "Command Palette",
        isEditable: true,
        isVisibleInSettings: true,
    },
    OPEN_WORKSPACE_DIRECTORY: {
        label: "Open workspace picker",
        description:
            "Choose a new workspace folder or switch the current workspace.",
        defaultBinding: "Mod+O",
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    TOGGLE_COMMAND_PALETTE_COMMANDS: {
        label: "Focus command results",
        description:
            "Switch the command palette to the commands scope while it is open.",
        defaultBinding: "Mod+1",
        groupLabel: "Command Palette",
        isEditable: true,
        isVisibleInSettings: true,
    },
    TOGGLE_COMMAND_PALETTE_WORKSPACES: {
        label: "Focus workspace results",
        description:
            "Switch the command palette to the workspaces scope while it is open.",
        defaultBinding: "Mod+2",
        groupLabel: "Command Palette",
        isEditable: true,
        isVisibleInSettings: true,
    },
    TOGGLE_SIDEBAR: {
        label: "Toggle sidebar",
        description: "Open or close the navigation sidebar.",
        defaultBinding: "Mod+B",
        groupLabel: "Navigation",
        isEditable: true,
        isVisibleInSettings: true,
    },
    OPEN_SETTINGS: {
        label: "Open settings",
        description:
            "Pinned to the native app menu shortcut so both entry points stay aligned.",
        defaultBinding: "Mod+,",
        groupLabel: "Navigation",
        isEditable: false,
        isVisibleInSettings: false,
    },
    ARCHIVE_WORKSPACE_TAB: {
        label: "Archive current tab",
        description: "Archive the active workspace tab when a tab is open.",
        defaultBinding: "Mod+W",
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    CREATE_WORKSPACE_FILE: {
        label: "Create new file",
        description: "Create a new script file in the current workspace.",
        defaultBinding: "Mod+T",
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    OPEN_WORKSPACE_SCREEN: {
        label: "Open workspace screen",
        description: "Jump to the workspace screen from anywhere in the app.",
        defaultBinding: "Mod+Shift+W",
        groupLabel: "Navigation",
        isEditable: true,
        isVisibleInSettings: true,
    },
    OPEN_SCRIPT_LIBRARY: {
        label: "Open script library",
        description: "Jump to the script library screen.",
        defaultBinding: "Mod+Shift+S",
        groupLabel: "Navigation",
        isEditable: true,
        isVisibleInSettings: true,
    },
    OPEN_ACCOUNTS: {
        label: "Open accounts",
        description: "Jump to the accounts screen.",
        defaultBinding: "Mod+Shift+A",
        groupLabel: "Navigation",
        isEditable: true,
        isVisibleInSettings: true,
    },
} as const satisfies Record<AppHotkeyAction, AppHotkeyDefinition>;

export const APP_RESERVED_NATIVE_MENU_HOTKEYS = [
    {
        label: "Reset zoom",
        binding: "Mod+0",
    },
    {
        label: "Zoom in",
        binding: "Mod+=",
    },
    {
        label: "Zoom out",
        binding: "Mod+-",
    },
    {
        label: "Open developer tools",
        binding: "Mod+Alt+I",
    },
] as const satisfies AppReservedHotkey[];

export const APP_RESERVED_APP_HOTKEYS = [
    {
        label: "Close command palette or settings",
        binding: "Escape",
    },
] as const satisfies AppReservedHotkey[];
