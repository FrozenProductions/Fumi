import type { IconSvgElement } from "@hugeicons/react";

export type AppCommandPaletteScope = "tabs" | "commands" | "workspaces";
export type AppCommandPaletteMode = "attach" | "goto-line" | "theme";
export type AppCommandPaletteViewMode = "default" | AppCommandPaletteMode;

export type AppCommandPaletteItem = {
    id: string;
    label: string;
    description: string;
    icon: IconSvgElement;
    meta?: string;
    keywords: string;
    isDisabled?: boolean;
    closeOnSelect?: boolean;
    onSelect: () => void;
};

export type AppGoToLineRequest = {
    lineNumber: number;
    requestId: number;
};

export type AppRenameCurrentTabRequest = {
    requestId: number;
};
