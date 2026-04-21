import type { IconSvgElement } from "@hugeicons/react";
import type { RegisterableHotkey } from "@tanstack/hotkeys";

export type AppIconGlyph = IconSvgElement;

export type AppCommandPaletteScope = "tabs" | "commands" | "workspaces";
export type AppCommandPaletteMode = "goto-line" | "theme";
export type AppCommandPaletteViewMode = "default" | AppCommandPaletteMode;

export type AppCommandPaletteItem = {
    id: string;
    label: string;
    description: string;
    icon: AppIconGlyph;
    meta?: string;
    keywords: string;
    isDisabled?: boolean;
    closeOnSelect?: boolean;
    onSelect: () => void;
};

export type AppGoToLineRequest = {
    lineNumber: number;
    requestId: number;
};

export type AppRenameCurrentTabRequest = {
    requestId: number;
};

export type AppSettingsSection =
    | "general"
    | "workspace"
    | "editor"
    | "hotkeys"
    | "dev";

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

export type AppTheme = "system" | "light" | "dark";
export type AppMiddleClickTabAction = "archive" | "delete";

export type AppIntellisensePriority = "balanced" | "language" | "executor";
export type AppIntellisenseWidth = "small" | "normal" | "large";

export type AppEditorSettings = {
    fontSize: number;
    isIntellisenseEnabled: boolean;
    intellisensePriority: AppIntellisensePriority;
    intellisenseWidth: AppIntellisenseWidth;
    isOutlinePanelVisible: boolean;
    outlinePanelWidth: number;
    outlineExpandedGroups: Record<string, boolean>;
    outlineSearchQuery: string;
};

export type AppUpdaterSettings = {
    isAutoUpdateEnabled: boolean;
};

export type AppWorkspaceSettings = {
    middleClickTabAction: AppMiddleClickTabAction;
};

export type AppAccountPrivacySettings = {
    isStreamerModeEnabled: boolean;
};

export type AppSidebarItem =
    | "workspace"
    | "automatic-execution"
    | "script-library"
    | "accounts"
    | "settings";

export type AppSidebarPosition = "left" | "right";

export type AppSidebarNavigationItem = {
    id: AppSidebarItem;
    label: string;
    icon: AppIconGlyph;
    shortcutLabel?: string;
};

export type AppSidebarActionItem = {
    label: string;
    icon: AppIconGlyph;
    shortcutLabel?: string;
};

export type AppUpdaterStatus =
    | "idle"
    | "checking"
    | "available"
    | "upToDate"
    | "downloading"
    | "installing"
    | "readyToRestart"
    | "error"
    | "unsupported";

export type AppUpdateMetadata = {
    currentVersion: string;
    version: string;
    date: string | null;
    body: string | null;
    rawJson: Record<string, unknown>;
};

export type AppUpdateDownloadProgress = {
    phase: "started" | "progress" | "finished";
    downloadedBytes: number;
    contentLength: number | null;
    progressPercent: number | null;
};
