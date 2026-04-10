import type { AppCommandPaletteScope } from "../../lib/app/app.type";
import type { AppCommandPaletteSearchFieldName } from "../../lib/app/commandPalette.type";

export const COMMAND_PALETTE_EXIT_DURATION_MS = 220;
export const COMMAND_PALETTE_ENTER_FOCUS_DELAY_MS = 170;
export const APP_COMMAND_PALETTE_MAX_RESULTS = 5;
export const APP_COMMAND_PALETTE_NORMALIZED_SEPARATOR_PATTERN = /[./\\_-]+/g;
export const APP_COMMAND_PALETTE_WHITESPACE_PATTERN = /\s+/g;
export const APP_COMMAND_PALETTE_SINGLE_CHARACTER_QUERY_LENGTH = 1;
export const APP_COMMAND_PALETTE_SEARCH_FIELD_SCORES = {
    exactField: 6000,
    exactToken: 5000,
    fieldPrefix: 4000,
    tokenPrefix: 3000,
    substring: 2000,
    fuzzy: 1000,
} as const;
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
