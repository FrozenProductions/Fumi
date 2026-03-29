import type { AppIconGlyph } from "./icon";

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
