import { ACTORS_TOP_LEVEL_COMPLETIONS } from "../../../constants/luau/community/actorsCompletions";
import { RAKNET_TOP_LEVEL_COMPLETIONS } from "../../../constants/luau/community/raknetCompletions";
import {
    LUAU_KEYWORD_DOCS,
    LUAU_TYPE_DOCS,
} from "../../../constants/luau/core/luau";
import { LUAU_TOP_LEVEL_COMPLETIONS } from "../../../constants/luau/core/luauTopLevelCompletions";
import {
    LUAU_BUILTIN_CONSTANTS,
    LUAU_BUILTIN_TYPES,
    LUAU_COMPLETION_KEYWORDS,
} from "../../../constants/luau/core/syntax";
import { ROBLOX_TOP_LEVEL_COMPLETIONS } from "../../../constants/luau/roblox/robloxTopLevelCompletions";
import { SUNC_TOP_LEVEL_COMPLETIONS } from "../../../constants/luau/sunc/suncCompletions";
import { UNC_TOP_LEVEL_COMPLETIONS } from "../../../constants/luau/unc/uncCompletions";
import type { LuauCompletionItem } from "../luau.type";

function getCompletionKey(
    item: LuauCompletionItem,
    namespace = item.namespace ?? "",
): string {
    return `${namespace.toLowerCase()}::${item.label.toLowerCase()}`;
}

export function dedupeCompletionItems(
    items: readonly LuauCompletionItem[],
    namespace = "",
): LuauCompletionItem[] {
    const seen = new Set<string>();
    const dedupedItems: LuauCompletionItem[] = [];

    for (const item of items) {
        const key = getCompletionKey(item, namespace);

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        dedupedItems.push(item);
    }

    return dedupedItems;
}

const LUAU_COMPLETION_ROOT_KEYWORDS = LUAU_COMPLETION_KEYWORDS.filter(
    (keyword) => keyword !== "export",
);

export const LUAU_ROOT_COMPLETIONS: LuauCompletionItem[] =
    dedupeCompletionItems([
        ...LUAU_COMPLETION_ROOT_KEYWORDS.map((keyword) => ({
            label: keyword,
            kind: "keyword" as const,
            detail: "keyword",
            doc: {
                summary:
                    LUAU_KEYWORD_DOCS[keyword] ??
                    "Reserved Luau language keyword.",
                source: "Official Luau syntax docs",
            },
            score: 1500,
            sourceGroup: "language" as const,
        })),
        ...LUAU_BUILTIN_TYPES.map((typeName) => ({
            label: typeName,
            kind: "datatype" as const,
            detail: "builtin type",
            doc: {
                summary:
                    LUAU_TYPE_DOCS[typeName] ?? "Builtin Luau type annotation.",
                source: "Official Luau typechecking docs",
            },
            score: 1400,
            sourceGroup: "language" as const,
        })),
        ...LUAU_BUILTIN_CONSTANTS.map((constantName) => ({
            label: constantName,
            kind: "constant" as const,
            detail: "builtin constant",
            doc: {
                summary: "Builtin Luau constant.",
                source: "Official Luau syntax docs",
            },
            score: 1300,
            sourceGroup: "language" as const,
        })),
        ...LUAU_TOP_LEVEL_COMPLETIONS,
        ...ROBLOX_TOP_LEVEL_COMPLETIONS,
        ...SUNC_TOP_LEVEL_COMPLETIONS,
        ...UNC_TOP_LEVEL_COMPLETIONS,
        ...ACTORS_TOP_LEVEL_COMPLETIONS,
        ...RAKNET_TOP_LEVEL_COMPLETIONS,
    ]);
