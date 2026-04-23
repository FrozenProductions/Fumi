import { APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS } from "../../../../constants/app/commandPalette";
import {
    normalizeSearchValue,
    scoreSearchFields,
    searchItems,
} from "../../../shared/search";
import type { SearchField } from "../../../shared/search.type";
import type { AppCommandPaletteSearchFieldName } from "../commandPalette.type";
import type { AppCommandPaletteItem } from "../commandPaletteDomain.type";

/**
 * Normalizes a command palette search value for matching.
 */
export function normalizeAppCommandPaletteSearchValue(value: string): string {
    return normalizeSearchValue(value);
}

/**
 * Scores a command palette item against the search value, returning null for no match.
 */
export function scoreAppCommandPaletteItem(
    item: AppCommandPaletteItem,
    searchValue: string,
): number | null {
    return scoreSearchFields(
        getAppCommandPaletteSearchFields(item),
        searchValue,
        APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS,
    );
}

/**
 * Searches command palette items by relevance and returns up to `limit` results.
 */
export function searchAppCommandPaletteItems(
    items: AppCommandPaletteItem[],
    searchValue: string,
    limit: number,
): AppCommandPaletteItem[] {
    return searchItems(
        items,
        searchValue,
        limit,
        getAppCommandPaletteSearchFields,
        APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS,
    );
}

function getAppCommandPaletteSearchFields(
    item: AppCommandPaletteItem,
): SearchField<AppCommandPaletteSearchFieldName>[] {
    return [
        { name: "label", value: item.label },
        { name: "keywords", value: item.keywords },
        { name: "meta", value: item.meta ?? "" },
        { name: "description", value: item.description },
    ];
}
