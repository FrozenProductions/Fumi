import { ACTORS_TOP_LEVEL_COMPLETIONS } from "../../constants/luau/actorsCompletions";
import {
    LUAU_NAMESPACE_COMPLETIONS,
    LUAU_TOP_LEVEL_COMPLETIONS,
} from "../../constants/luau/luauCompletions";
import {
    RAKNET_NAMESPACE_COMPLETIONS,
    RAKNET_TOP_LEVEL_COMPLETIONS,
} from "../../constants/luau/raknetCompletions";
import {
    ROBLOX_NAMESPACE_COMPLETIONS,
    ROBLOX_TOP_LEVEL_COMPLETIONS,
} from "../../constants/luau/robloxCompletions";
import {
    SUNC_NAMESPACE_COMPLETIONS,
    SUNC_TOP_LEVEL_COMPLETIONS,
} from "../../constants/luau/suncCompletions";
import {
    LUAU_BUILTIN_CONSTANTS,
    LUAU_BUILTIN_TYPES,
    LUAU_COMPLETION_KEYWORDS,
} from "../../constants/luau/syntax";
import {
    UNC_NAMESPACE_COMPLETIONS,
    UNC_TOP_LEVEL_COMPLETIONS,
} from "../../constants/luau/uncCompletions";
import type { AppIntellisensePriority } from "../../lib/app/app.type";
import type {
    LuauCompletionItem,
    LuauFileSymbol,
} from "../../lib/luau/luau.type";
import type { LuauFileAnalysis } from "../../lib/luau/symbolScanner.type";
import type { LuauCompletionQuery } from "./completion.type";

const MAX_LUAU_COMPLETION_ITEMS = 6;

const LUAU_KEYWORD_DOCS: Record<string, string> = {
    as: "Assert that an expression should be treated as a specific type.",
    continue:
        "Skip the rest of the current loop iteration and continue with the next one.",
    function: "Define a function body.",
    local: "Declare a local variable or function.",
    type: "Declare a Luau type alias.",
    typeof: "Capture the inferred type of an expression for use in type annotations.",
};

const LUAU_TYPE_DOCS: Record<string, string> = {
    any: "Opt out of static type checking for a value.",
    boolean: "Boolean true/false type.",
    buffer: "Binary buffer type for byte-oriented storage.",
    function: "Callable function type.",
    never: "Represents an impossible code path or uninhabited type.",
    nil: "Represents the absence of a value.",
    number: "Numeric value type.",
    string: "String value type.",
    table: "Table value type.",
    thread: "Coroutine thread type.",
    unknown: "A value of unknown type that must be refined before use.",
    userdata: "Opaque userdata type.",
    vector: "Native vector type available in Luau runtimes that support it.",
};

export const LUAU_MODE_IDENTIFIER = "ace/mode/luau";

function getLineAtRow(content: string, row: number): string {
    let currentRow = 0;
    let lineStart = 0;

    for (let index = 0; index < content.length; index += 1) {
        if (currentRow === row && content[index] === "\n") {
            return content.slice(lineStart, index);
        }

        if (content[index] === "\n") {
            currentRow += 1;
            lineStart = index + 1;
        }
    }

    return currentRow === row ? content.slice(lineStart) : "";
}

function getAbsoluteIndexForPosition(
    content: string,
    row: number,
    column: number,
): number {
    let currentRow = 0;
    let index = 0;

    while (index < content.length && currentRow < row) {
        if (content[index] === "\n") {
            currentRow += 1;
        }

        index += 1;
    }

    return Math.min(index + column, content.length);
}

function createCompletionItemFromFileSymbol(
    symbol: LuauFileSymbol,
): LuauCompletionItem {
    return {
        label: symbol.label,
        kind: symbol.kind,
        detail: symbol.detail,
        doc: symbol.doc,
        insertText: symbol.insertText,
        score: symbol.score,
        sourceGroup: "file",
    };
}

function getInnermostFunctionOwner(
    functionScopes: ReadonlyArray<{
        end: number;
        start: number;
    }>,
    cursorIndex: number,
): number | null {
    let innermostStart: number | null = null;
    let innermostWidth = Number.POSITIVE_INFINITY;

    for (const scope of functionScopes) {
        if (scope.start > cursorIndex || cursorIndex > scope.end) {
            continue;
        }

        const width = scope.end - scope.start;
        if (width < innermostWidth) {
            innermostStart = scope.start;
            innermostWidth = width;
        }
    }

    return innermostStart;
}

function shouldIncludeFileSymbol(
    symbol: LuauFileSymbol,
    cursorIndex: number,
    currentFunctionOwner: number | null,
): boolean {
    if (symbol.visibleStart > cursorIndex || cursorIndex > symbol.visibleEnd) {
        return false;
    }

    if (!symbol.isLexical) {
        return true;
    }

    return symbol.ownerFunctionStart === currentFunctionOwner;
}

function getCompletionKey(
    item: LuauCompletionItem,
    namespace = item.namespace ?? "",
): string {
    return `${namespace.toLowerCase()}::${item.label.toLowerCase()}`;
}

function dedupeCompletionItems(
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

function createNamespaceIndex(): Map<string, LuauCompletionItem[]> {
    const namespaceIndex = new Map<string, LuauCompletionItem[]>();

    for (const group of [
        ...LUAU_NAMESPACE_COMPLETIONS,
        ...ROBLOX_NAMESPACE_COMPLETIONS,
        ...SUNC_NAMESPACE_COMPLETIONS,
        ...UNC_NAMESPACE_COMPLETIONS,
        ...RAKNET_NAMESPACE_COMPLETIONS,
    ]) {
        const existingItems = namespaceIndex.get(group.namespace) ?? [];
        const mergedItems = dedupeCompletionItems(
            [...existingItems, ...group.items],
            group.namespace,
        );

        namespaceIndex.set(group.namespace, mergedItems);
    }

    return namespaceIndex;
}

const LUAU_NAMESPACE_INDEX = createNamespaceIndex();
const LUAU_COMPLETION_ROOT_KEYWORDS = LUAU_COMPLETION_KEYWORDS.filter(
    (keyword) => keyword !== "export",
);

const LUAU_ROOT_COMPLETIONS: LuauCompletionItem[] = dedupeCompletionItems([
    ...LUAU_COMPLETION_ROOT_KEYWORDS.map((keyword) => ({
        label: keyword,
        kind: "keyword" as const,
        detail: "keyword",
        doc: {
            summary:
                LUAU_KEYWORD_DOCS[keyword] ?? "Reserved Luau language keyword.",
            source: "Official Luau syntax docs",
        },
        score: 1500,
        sourceGroup: "language" as const,
    })),
    ...LUAU_BUILTIN_TYPES.map((typeName) => ({
        label: typeName,
        kind: "type" as const,
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

function compareCompletionItems(
    left: LuauCompletionItem,
    right: LuauCompletionItem,
    priority: AppIntellisensePriority,
): number {
    const sourceGroupDifference =
        getPriorityWeight(right.sourceGroup, priority) -
        getPriorityWeight(left.sourceGroup, priority);
    if (sourceGroupDifference !== 0) {
        return sourceGroupDifference;
    }

    const scoreDifference = (right.score ?? 0) - (left.score ?? 0);
    if (scoreDifference !== 0) {
        return scoreDifference;
    }

    return left.label.localeCompare(right.label);
}

function getPriorityWeight(
    sourceGroup: LuauCompletionItem["sourceGroup"],
    priority: AppIntellisensePriority,
): number {
    if (sourceGroup === "file") {
        return 3;
    }

    if (priority === "language") {
        return sourceGroup === "language" ? 2 : 1;
    }

    if (priority === "executor") {
        return sourceGroup === "executor" ? 2 : 1;
    }

    return 1;
}

function filterCompletions(
    items: readonly LuauCompletionItem[],
    prefix: string,
    priority: AppIntellisensePriority,
): LuauCompletionItem[] {
    const normalizedPrefix = prefix.toLowerCase();
    if (!normalizedPrefix) {
        return [...items].sort((left, right) =>
            compareCompletionItems(left, right, priority),
        );
    }

    return items
        .filter((item) => item.label.toLowerCase().startsWith(normalizedPrefix))
        .sort((left, right) => compareCompletionItems(left, right, priority));
}

function getVisibleFileCompletionItems(
    analysis: LuauFileAnalysis | null,
    cursorIndex: number,
): LuauCompletionItem[] {
    if (!analysis) {
        return [];
    }

    const currentFunctionOwner = getInnermostFunctionOwner(
        analysis.functionScopes,
        cursorIndex,
    );

    return analysis.symbols
        .filter((symbol) =>
            shouldIncludeFileSymbol(symbol, cursorIndex, currentFunctionOwner),
        )
        .map(createCompletionItemFromFileSymbol);
}

export function getLuauCompletionQuery(options: {
    analysis: LuauFileAnalysis | null;
    column: number;
    content: string;
    priority: AppIntellisensePriority;
    row: number;
}): LuauCompletionQuery {
    const { analysis, column, content, priority, row } = options;
    const line = getLineAtRow(content, row);
    const beforeCursor = line.slice(0, column);
    const namespacedMatch = beforeCursor.match(
        /([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\.([A-Za-z0-9_]*)$/,
    );

    if (namespacedMatch) {
        const [, namespacePath, prefix] = namespacedMatch;

        return {
            items: filterCompletions(
                LUAU_NAMESPACE_INDEX.get(namespacePath) ?? [],
                prefix,
                priority,
            ).slice(0, MAX_LUAU_COMPLETION_ITEMS),
            namespacePath,
            prefix,
            replaceStartColumn: column - prefix.length,
            replaceEndColumn: column,
        };
    }

    const rootPrefixMatch = beforeCursor.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    const prefix = rootPrefixMatch?.[1] ?? "";
    const cursorIndex = getAbsoluteIndexForPosition(content, row, column);
    const visibleFileItems = getVisibleFileCompletionItems(
        analysis,
        cursorIndex,
    );
    const rootItems = dedupeCompletionItems([
        ...visibleFileItems,
        ...LUAU_ROOT_COMPLETIONS,
    ]);

    return {
        items: filterCompletions(rootItems, prefix, priority).slice(
            0,
            MAX_LUAU_COMPLETION_ITEMS,
        ),
        namespacePath: null,
        prefix,
        replaceStartColumn: column - prefix.length,
        replaceEndColumn: column,
    };
}

export function shouldOpenLuauCompletion(
    query: LuauCompletionQuery,
    forceOpen = false,
): boolean {
    if (query.items.length === 0) {
        return false;
    }

    if (forceOpen) {
        return true;
    }

    const normalizedPrefix = query.prefix.toLowerCase();
    const hasExactOnlyMatches =
        normalizedPrefix.length > 0 &&
        query.items.every(
            (item) => item.label.toLowerCase() === normalizedPrefix,
        );

    if (hasExactOnlyMatches) {
        return false;
    }

    return query.namespacePath !== null || query.prefix.length > 0;
}
