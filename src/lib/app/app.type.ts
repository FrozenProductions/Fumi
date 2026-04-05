import type { IconSvgElement } from "@hugeicons/react";

export type AppIconGlyph = IconSvgElement;

export type AppCommandPaletteScope = "tabs" | "commands" | "workspaces";
export type AppCommandPaletteMode = "goto-line";
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

export type AppSettingsSection = "general" | "workspace" | "editor";

export type AppTheme = "light" | "dark";

export type AppIntellisensePriority = "balanced" | "language" | "executor";
export type AppIntellisenseWidth = "small" | "normal" | "large";

export type AppEditorSettings = {
    fontSize: number;
    isIntellisenseEnabled: boolean;
    intellisensePriority: AppIntellisensePriority;
    intellisenseWidth: AppIntellisenseWidth;
};

export type AppUpdaterSettings = {
    isAutoUpdateEnabled: boolean;
};

export type AppSidebarItem = "workspace" | "script-library" | "settings";

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
