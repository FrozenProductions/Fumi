export type AppSettingsSection = "general" | "workspace" | "editor";

export type AppTheme = "light" | "dark";

export type AppIntellisensePriority = "balanced" | "language" | "executor";

export type AppEditorSettings = {
    fontSize: number;
    isIntellisenseEnabled: boolean;
    intellisensePriority: AppIntellisensePriority;
};
