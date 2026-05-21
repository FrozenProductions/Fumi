import type { IconSvgElement } from "@hugeicons/react";

export type AppCommandPaletteScope = "tabs" | "commands" | "workspaces";
export type AppCommandPaletteMode =
    | "archived-tab"
    | "attach"
    | "delete-archived-tab"
    | "goto-line"
    | "intellisense-priority"
    | "symbol"
    | "tab-size"
    | "theme";
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
    column?: number;
    requestId: number;
};

export type ParsedGoToLineResult = {
    line: number;
    column: number | null;
};

export type AppRenameCurrentTabRequest = {
    requestId: number;
};
