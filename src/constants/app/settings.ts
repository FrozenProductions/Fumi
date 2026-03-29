import type {
    AppEditorSettings,
    AppIntellisensePriority,
    AppSettingsSection,
    AppTheme,
} from "../../types/app/settings";
import {
    DEFAULT_PAGE_ZOOM,
    MAX_PAGE_ZOOM,
    MIN_PAGE_ZOOM,
    PAGE_ZOOM_STEP,
} from "../window/window";

type AppSettingsSectionOption = {
    id: AppSettingsSection;
    label: string;
};

type AppThemeOption = {
    value: AppTheme;
    label: string;
};

type AppIntellisensePriorityOption = {
    value: AppIntellisensePriority;
    label: string;
};

export const APP_SETTINGS_SECTIONS = [
    { id: "general", label: "General" },
    { id: "editor", label: "Editor" },
    { id: "workspace", label: "Archived Tabs" },
] as const satisfies AppSettingsSectionOption[];

export const DEFAULT_APP_SETTINGS_SECTION =
    "general" satisfies AppSettingsSection;

export const APP_THEME_OPTIONS = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
] as const satisfies AppThemeOption[];

export const APP_INTELLISENSE_PRIORITY_OPTIONS = [
    { value: "balanced", label: "Balanced" },
    { value: "language", label: "Luau-first" },
    { value: "executor", label: "Executor-first" },
] as const satisfies AppIntellisensePriorityOption[];

export const DEFAULT_APP_THEME = "light" satisfies AppTheme;

export const DEFAULT_APP_EDITOR_SETTINGS = {
    fontSize: 13,
    isIntellisenseEnabled: true,
    intellisensePriority: "balanced",
} as const satisfies AppEditorSettings;

export const APP_EDITOR_FONT_SIZE_MIN = 10;
export const APP_EDITOR_FONT_SIZE_MAX = 25;

export const APP_ZOOM_MIN = Math.round(MIN_PAGE_ZOOM * 100);
export const APP_ZOOM_MAX = Math.round(MAX_PAGE_ZOOM * 100);
export const APP_ZOOM_STEP = Math.round(PAGE_ZOOM_STEP * 100);
export const APP_ZOOM_DEFAULT = Math.round(DEFAULT_PAGE_ZOOM * 100);
