import type { AppCommandPaletteScope } from "../../lib/app/app.type";
import type { AppCommandPaletteSearchFieldName } from "../../lib/app/commandPalette/commandPalette.type";

export const COMMAND_PALETTE_EXIT_DURATION_MS = 220;
export const COMMAND_PALETTE_ENTER_FOCUS_DELAY_MS = 170;
export const APP_COMMAND_PALETTE_MAX_RESULTS = 5;
export const APP_COMMAND_PALETTE_RESULT_ROW_HEIGHT_REM = 3;
export const APP_COMMAND_PALETTE_RESULT_ROW_GAP_REM = 0.125;
export const APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS = {
    label: 80,
    keywords: 60,
    meta: 40,
    description: 20,
} as const satisfies Record<AppCommandPaletteSearchFieldName, number>;

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
