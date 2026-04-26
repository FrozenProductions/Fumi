import type { HotkeysProviderOptions } from "@tanstack/react-hotkeys";
import type {
    AppHotkeyAction,
    AppHotkeyDefinition,
    AppReservedHotkey,
} from "../../lib/app/hotkeys/hotkeys.type";

export const HOTKEY_KEY_CODE_MAP = {
    "`": "Backquote",
    "-": "Minus",
    "=": "Equal",
    "[": "BracketLeft",
    "]": "BracketRight",
    "\\": "Backslash",
    ";": "Semicolon",
    "'": "Quote",
    ",": "Comma",
    ".": "Period",
    "/": "Slash",
} as const satisfies Record<string, string>;

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
    "TOGGLE_WORKSPACE_SPLIT_VIEW",
    "MOVE_WORKSPACE_TAB_TO_LEFT_PANE",
    "MOVE_WORKSPACE_TAB_TO_RIGHT_PANE",
    "FOCUS_WORKSPACE_LEFT_PANE",
    "FOCUS_WORKSPACE_RIGHT_PANE",
    "RESET_WORKSPACE_SPLIT_VIEW",
    "TOGGLE_EXECUTOR_CONNECTION",
    "LAUNCH_ROBLOX",
    "KILL_ROBLOX",
    "OPEN_WORKSPACE_SCREEN",
    "OPEN_AUTOMATIC_EXECUTION",
    "OPEN_SCRIPT_LIBRARY",
    "OPEN_ACCOUNTS",
    "TOGGLE_OUTLINE_PANEL",
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
    TOGGLE_WORKSPACE_SPLIT_VIEW: {
        label: "Toggle split view",
        description:
            "Open a two-pane editor for the active tab, or close the current split.",
        defaultBinding: {
            key: "\\",
            mod: true,
        },
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    MOVE_WORKSPACE_TAB_TO_LEFT_PANE: {
        label: "Move current tab to left pane",
        description:
            "Move the active tab into the left pane, creating a split if needed.",
        defaultBinding: {
            key: "ArrowLeft",
            mod: true,
            ctrl: true,
        },
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    MOVE_WORKSPACE_TAB_TO_RIGHT_PANE: {
        label: "Move current tab to right pane",
        description:
            "Move the active tab into the right pane, creating a split if needed.",
        defaultBinding: {
            key: "ArrowRight",
            mod: true,
            ctrl: true,
        },
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    FOCUS_WORKSPACE_LEFT_PANE: {
        label: "Focus left pane",
        description: "Move focus to the left side of the current split view.",
        defaultBinding: {
            key: "1",
            mod: true,
            ctrl: true,
        },
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    FOCUS_WORKSPACE_RIGHT_PANE: {
        label: "Focus right pane",
        description: "Move focus to the right side of the current split view.",
        defaultBinding: {
            key: "2",
            mod: true,
            ctrl: true,
        },
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    RESET_WORKSPACE_SPLIT_VIEW: {
        label: "Reset split ratio",
        description:
            "Reset the current split editor back to an even 50/50 layout.",
        defaultBinding: {
            key: "0",
            mod: true,
            ctrl: true,
        },
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    TOGGLE_EXECUTOR_CONNECTION: {
        label: "Attach or detach executor",
        description:
            "Attach to the selected executor port, or detach the active executor connection.",
        defaultBinding: "Mod+Shift+C",
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    LAUNCH_ROBLOX: {
        label: "Launch Roblox",
        description:
            "Launch a Roblox client from the workspace screen in the desktop app.",
        defaultBinding: "Mod+Shift+L",
        groupLabel: "Workspace",
        isEditable: true,
        isVisibleInSettings: true,
    },
    KILL_ROBLOX: {
        label: "Kill Roblox",
        description:
            "Terminate running Roblox clients from the workspace screen in the desktop app.",
        defaultBinding: "Mod+Shift+K",
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
    OPEN_AUTOMATIC_EXECUTION: {
        label: "Open automatic execution",
        description: "Jump to the automatic execution screen.",
        defaultBinding: "Mod+Shift+E",
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
    TOGGLE_OUTLINE_PANEL: {
        label: "Toggle outline panel",
        description:
            "Show or hide the outline panel that displays functions, locals, and globals.",
        defaultBinding: "Mod+Shift+O",
        groupLabel: "Workspace",
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

export const HOTKEY_PROVIDER_DEFAULT_OPTIONS: HotkeysProviderOptions = {
    hotkey: {
        preventDefault: true,
        stopPropagation: true,
        conflictBehavior: "warn",
    },
};
