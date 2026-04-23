import type {
    AppIntellisensePriority,
    AppIntellisenseWidth,
    AppMiddleClickTabAction,
    AppSettingsSection,
    AppTheme,
} from "../../lib/app/app.type";
import type { AppSidebarPosition } from "../../lib/app/sidebar.type";

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

export type AppMiddleClickTabActionOption = {
    value: AppMiddleClickTabAction;
    label: string;
};

export type AppSidebarPositionOption = {
    value: AppSidebarPosition;
    label: string;
};
