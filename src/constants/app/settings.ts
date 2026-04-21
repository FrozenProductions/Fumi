import type {
    AppEditorSettings,
    AppMiddleClickTabAction,
    AppSettingsSection,
    AppSidebarPosition,
    AppTheme,
    AppUpdaterSettings,
    AppWorkspaceSettings,
} from "../../lib/app/app.type";
import {
    DEFAULT_PAGE_ZOOM,
    MAX_PAGE_ZOOM,
    MIN_PAGE_ZOOM,
    PAGE_ZOOM_STEP,
} from "../window/window";
import { WORKSPACE_OUTLINE_PANEL_DEFAULT_WIDTH } from "../workspace/outline";
import type {
    AppIntellisensePriorityOption,
    AppIntellisenseWidthOption,
    AppMiddleClickTabActionOption,
    AppSettingsSectionOption,
    AppSidebarPositionOption,
    AppThemeOption,
} from "./settings.type";

export const APP_SETTINGS_SECTIONS = [
    { id: "general", label: "General" },
    { id: "editor", label: "Editor" },
    { id: "hotkeys", label: "Hotkeys" },
    { id: "workspace", label: "Archived Tabs" },
    { id: "dev", label: "Developer" },
] as const satisfies AppSettingsSectionOption[];

export const DEFAULT_APP_SETTINGS_SECTION =
    "general" satisfies AppSettingsSection;

export const APP_THEME_OPTIONS = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
] as const satisfies AppThemeOption[];

export const APP_INTELLISENSE_PRIORITY_OPTIONS = [
    { value: "balanced", label: "Balanced" },
    { value: "language", label: "Luau-first" },
    { value: "executor", label: "Executor-first" },
] as const satisfies AppIntellisensePriorityOption[];

export const APP_INTELLISENSE_WIDTH_OPTIONS = [
    { value: "small", label: "Small" },
    { value: "normal", label: "Normal" },
    { value: "large", label: "Large" },
] as const satisfies AppIntellisenseWidthOption[];

export const APP_MIDDLE_CLICK_TAB_ACTION_OPTIONS = [
    { value: "archive", label: "Archive" },
    { value: "delete", label: "Delete" },
] as const satisfies AppMiddleClickTabActionOption[];

export const APP_SIDEBAR_POSITION_OPTIONS = [
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
] as const satisfies AppSidebarPositionOption[];

export const DEFAULT_APP_THEME = "system" satisfies AppTheme;
export const DEFAULT_APP_MIDDLE_CLICK_TAB_ACTION =
    "archive" satisfies AppMiddleClickTabAction;
export const DEFAULT_APP_SIDEBAR_POSITION = "left" satisfies AppSidebarPosition;
export const DEFAULT_APP_STREAMER_MODE_ENABLED = false;

export const DEFAULT_APP_EDITOR_SETTINGS = {
    fontSize: 13,
    isIntellisenseEnabled: true,
    intellisensePriority: "balanced",
    intellisenseWidth: "large",
    isOutlinePanelVisible: true,
    outlinePanelWidth: WORKSPACE_OUTLINE_PANEL_DEFAULT_WIDTH,
    outlineExpandedGroups: {
        Functions: true,
        Comments: true,
        Locals: true,
        Globals: true,
    },
    outlineSearchQuery: "",
} as const satisfies AppEditorSettings;

export const DEFAULT_APP_UPDATER_SETTINGS = {
    isAutoUpdateEnabled: true,
} as const satisfies AppUpdaterSettings;

export const DEFAULT_APP_WORKSPACE_SETTINGS = {
    middleClickTabAction: DEFAULT_APP_MIDDLE_CLICK_TAB_ACTION,
} as const satisfies AppWorkspaceSettings;

export const APP_EDITOR_FONT_SIZE_MIN = 10;
export const APP_EDITOR_FONT_SIZE_MAX = 25;

export const APP_ZOOM_MIN = Math.round(MIN_PAGE_ZOOM * 100);
export const APP_ZOOM_MAX = Math.round(MAX_PAGE_ZOOM * 100);
export const APP_ZOOM_STEP = Math.round(PAGE_ZOOM_STEP * 100);
export const APP_ZOOM_DEFAULT = Math.round(DEFAULT_PAGE_ZOOM * 100);
