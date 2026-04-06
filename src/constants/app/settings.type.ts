import type {
    AppIntellisensePriority,
    AppIntellisenseWidth,
    AppSettingsSection,
    AppTheme,
} from "../../lib/app/app.type";

export type AppSettingsSectionOption = {
    id: AppSettingsSection;
    label: string;
};

export type AppThemeOption = {
    value: AppTheme;
    label: string;
};

export type AppIntellisensePriorityOption = {
    value: AppIntellisensePriority;
    label: string;
};

export type AppIntellisenseWidthOption = {
    value: AppIntellisenseWidth;
    label: string;
};
