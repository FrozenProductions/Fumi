import type { GetCommandPaletteCommandItemsOptions } from "../commandPalette.type";
import type { AppCommandPaletteItem } from "../commandPaletteDomain.type";
import { getBaseCommandPaletteItems } from "./commandPaletteBaseCommands";
import { getActiveTabCommandItems } from "./commandPaletteTabCommands";
import { getWorkspaceCommandItems } from "./commandPaletteWorkspaceCommands";

/** Aggregates base, workspace, and active tab command palette items into a single list. */
export function getCommandCommandPaletteItems(
    options: GetCommandPaletteCommandItemsOptions,
): AppCommandPaletteItem[] {
    return [
        ...getBaseCommandPaletteItems(options),
        ...getWorkspaceCommandItems(options),
        ...getActiveTabCommandItems(options),
    ];
}
