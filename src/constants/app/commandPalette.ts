import type { AppCommandPaletteScope } from "../../lib/app/app.type";

export const COMMAND_PALETTE_EXIT_DURATION_MS = 220;
export const COMMAND_PALETTE_ENTER_FOCUS_DELAY_MS = 170;

export const APP_COMMAND_PALETTE_SCOPE_LABELS = {
    tabs: "Tabs",
    commands: "Commands",
    workspaces: "Workspaces",
} as const satisfies Record<AppCommandPaletteScope, string>;

export const APP_COMMAND_PALETTE_SCOPE_PLACEHOLDERS = {
    tabs: "Search tabs",
    commands: "Search commands",
    workspaces: "Search workspaces",
} as const satisfies Record<AppCommandPaletteScope, string>;
