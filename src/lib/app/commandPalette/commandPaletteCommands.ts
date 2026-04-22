import type { AppCommandPaletteItem } from "../app.type";
import type { GetCommandPaletteCommandItemsOptions } from "./commandPalette.type";
import { getBaseCommandPaletteItems } from "./commandPaletteBaseCommands";
import { getActiveTabCommandItems } from "./commandPaletteTabCommands";
import { getWorkspaceCommandItems } from "./commandPaletteWorkspaceCommands";

export function getCommandCommandPaletteItems(
    options: GetCommandPaletteCommandItemsOptions,
): AppCommandPaletteItem[] {
    return [
        ...getBaseCommandPaletteItems(options),
        ...getWorkspaceCommandItems(options),
        ...getActiveTabCommandItems(options),
    ];
}
