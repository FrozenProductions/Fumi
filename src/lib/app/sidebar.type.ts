import type { AppIconGlyph } from "./app.type";

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
