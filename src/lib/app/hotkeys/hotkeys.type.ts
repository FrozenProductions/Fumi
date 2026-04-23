import type { RegisterableHotkey } from "@tanstack/hotkeys";

export type AppHotkeyAction =
    | "QUIT_APP"
    | "OPEN_COMMAND_PALETTE"
    | "ACTIVATE_GOTO_LINE_COMMAND"
    | "OPEN_WORKSPACE_DIRECTORY"
    | "TOGGLE_COMMAND_PALETTE_COMMANDS"
    | "TOGGLE_COMMAND_PALETTE_WORKSPACES"
    | "TOGGLE_SIDEBAR"
    | "OPEN_SETTINGS"
    | "ARCHIVE_WORKSPACE_TAB"
    | "CREATE_WORKSPACE_FILE"
    | "TOGGLE_WORKSPACE_SPLIT_VIEW"
    | "MOVE_WORKSPACE_TAB_TO_LEFT_PANE"
    | "MOVE_WORKSPACE_TAB_TO_RIGHT_PANE"
    | "FOCUS_WORKSPACE_LEFT_PANE"
    | "FOCUS_WORKSPACE_RIGHT_PANE"
    | "RESET_WORKSPACE_SPLIT_VIEW"
    | "LAUNCH_ROBLOX"
    | "KILL_ROBLOX"
    | "OPEN_WORKSPACE_SCREEN"
    | "OPEN_AUTOMATIC_EXECUTION"
    | "OPEN_SCRIPT_LIBRARY"
    | "OPEN_ACCOUNTS"
    | "TOGGLE_OUTLINE_PANEL";

export type AppHotkeyBinding = RegisterableHotkey;
export type AppHotkeyBindings = Partial<
    Record<AppHotkeyAction, AppHotkeyBinding>
>;

export type AppHotkeyDefinition = {
    label: string;
    description: string;
    defaultBinding: AppHotkeyBinding;
    groupLabel: string;
    isEditable: boolean;
    isVisibleInSettings: boolean;
};

export type ResolvedAppHotkey = AppHotkeyDefinition & {
    action: AppHotkeyAction;
    binding: AppHotkeyBinding;
    shortcutLabel: string;
    isCustomized: boolean;
};

export type AppReservedHotkey = {
    label: string;
    binding: string;
};

export type AppHotkeyConflict = {
    label: string;
    shortcutLabel: string;
};
