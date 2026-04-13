import { WORKSPACE_OUTLINE_SEARCH_FIELD_WEIGHTS } from "../../constants/workspace/outline";
import type { LuauFileSymbol } from "../luau/luau.type";
import { searchItems } from "../shared/search";
import type { SearchField } from "../shared/search.type";
import type {
    WorkspaceOutlineGroup,
    WorkspaceOutlineSearchFieldName,
} from "./outlineSearch.type";

export function getWorkspaceOutlineGroups(
    symbols: LuauFileSymbol[],
): WorkspaceOutlineGroup[] {
    const functions: LuauFileSymbol[] = [];
    const locals: LuauFileSymbol[] = [];
    const globals: LuauFileSymbol[] = [];

    for (const symbol of symbols) {
        if (symbol.kind === "function" || symbol.kind === "namespace") {
            functions.push(symbol);
            continue;
        }

        if (symbol.isLexical) {
            locals.push(symbol);
            continue;
        }

        globals.push(symbol);
    }

    const groups: WorkspaceOutlineGroup[] = [];

    if (functions.length > 0) {
        groups.push({ title: "Functions", symbols: functions });
    }

    if (locals.length > 0) {
        groups.push({ title: "Locals", symbols: locals });
    }

    if (globals.length > 0) {
        groups.push({ title: "Globals", symbols: globals });
    }

    return groups;
}

export function searchWorkspaceOutlineGroups(
    symbols: LuauFileSymbol[],
    searchValue: string,
): WorkspaceOutlineGroup[] {
    const groups = getWorkspaceOutlineGroups(symbols);

    if (!searchValue.trim()) {
        return groups;
    }

    return groups
        .map((group) => ({
            ...group,
            symbols: searchItems(
                group.symbols,
                searchValue,
                group.symbols.length,
                (symbol) =>
                    getWorkspaceOutlineSearchFields(symbol, group.title),
                WORKSPACE_OUTLINE_SEARCH_FIELD_WEIGHTS,
            ),
        }))
        .filter((group) => group.symbols.length > 0);
}

function getWorkspaceOutlineSearchFields(
    symbol: LuauFileSymbol,
    groupTitle: string,
): SearchField<WorkspaceOutlineSearchFieldName>[] {
    return [
        { name: "label", value: symbol.label },
        { name: "detail", value: symbol.detail },
        { name: "group", value: groupTitle },
        { name: "kind", value: symbol.kind },
    ];
}
