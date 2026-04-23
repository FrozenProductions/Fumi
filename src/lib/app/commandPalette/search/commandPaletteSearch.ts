import { APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS } from "../../../../constants/app/commandPalette";
import {
    normalizeSearchValue,
    scoreSearchFields,
    searchItems,
} from "../../../shared/search";
import type { SearchField } from "../../../shared/search.type";
import type { AppCommandPaletteItem } from "../../app.type";
import type { AppCommandPaletteSearchFieldName } from "../commandPalette.type";

export function normalizeAppCommandPaletteSearchValue(value: string): string {
    return normalizeSearchValue(value);
}

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
