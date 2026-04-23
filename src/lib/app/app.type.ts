import type { IconSvgElement } from "@hugeicons/react";

export type AppIconGlyph = IconSvgElement;

export type AppTheme = "system" | "light" | "dark";
export type AppMiddleClickTabAction = "archive" | "delete";

export type AppIntellisensePriority = "balanced" | "language" | "executor";
export type AppIntellisenseWidth = "small" | "normal" | "large";

export type AppEditorSettings = {
    fontSize: number;
    isWordWrapEnabled: boolean;
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

export type AppSettingsSection =
    | "general"
    | "workspace"
    | "editor"
    | "hotkeys"
    | "dev";
