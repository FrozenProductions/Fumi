import type { AppIconGlyph } from "./icon";

export type AppSidebarItem = "workspace" | "script-library";

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
