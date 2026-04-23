import { ACTORS_TOP_LEVEL_COMPLETIONS } from "../../../constants/luau/community/actorsCompletions";
import {
    RAKNET_NAMESPACE_COMPLETIONS,
    RAKNET_TOP_LEVEL_COMPLETIONS,
} from "../../../constants/luau/community/raknetCompletions";
import {
    LUAU_KEYWORD_DOCS,
    LUAU_TYPE_DOCS,
    MAX_LUAU_COMPLETION_ITEMS,
} from "../../../constants/luau/core/luau";
import {
    EMPTY_LUAU_COMPLETION_INDEX_BY_PRIORITY,
    LUAU_COMPLETION_INDEX_PRIORITIES,
} from "../../../constants/luau/core/luauCompletionIndex";
import {
    LUAU_NAMESPACE_COMPLETIONS,
    LUAU_TOP_LEVEL_COMPLETIONS,
} from "../../../constants/luau/core/luauCompletions";
import {
    LUAU_BUILTIN_CONSTANTS,
    LUAU_BUILTIN_TYPES,
    LUAU_COMPLETION_KEYWORDS,
} from "../../../constants/luau/core/syntax";
import {
    ROBLOX_NAMESPACE_COMPLETIONS,
    ROBLOX_TOP_LEVEL_COMPLETIONS,
} from "../../../constants/luau/roblox/robloxCompletions";
import {
    SUNC_NAMESPACE_COMPLETIONS,
    SUNC_TOP_LEVEL_COMPLETIONS,
} from "../../../constants/luau/sunc/suncCompletions";
import {
    UNC_NAMESPACE_COMPLETIONS,
    UNC_TOP_LEVEL_COMPLETIONS,
} from "../../../constants/luau/unc/uncCompletions";
import type { AppIntellisensePriority } from "../../app/app.type";
import type { LuauCompletionItem, LuauFileSymbol } from "../luau.type";
import type { LuauFileAnalysis } from "../symbolScanner/symbolScanner.type";
import type {
    CompletionIndexByPriority,
    FileIndexedCompletionItem,
    IndexedCompletionItem,
    LuauCompletionQuery,
} from "./completion.type";

const FILE_COMPLETION_INDEX_CACHE = new WeakMap<
    LuauFileAnalysis,
    FileIndexedCompletionItem[]
>();

/**
 * Returns whether auto-completion should be suppressed for the given Ace token type.
 *
 * @remarks
 * Suppresses in comments and strings.
 */
export function shouldSuppressLuauCompletionForTokenType(
    tokenType: string | undefined,
): boolean {
    const normalizedTokenType = tokenType?.toLowerCase() ?? "";

    return (
        normalizedTokenType.includes("comment") ||
        normalizedTokenType.includes("string")
    );
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

function createIndexedCompletionItem(
    item: LuauCompletionItem,
    namespace = item.namespace ?? "",
): IndexedCompletionItem {
    return {
        item,
        key: getCompletionKey(item, namespace),
        normalizedLabel: item.label.toLowerCase(),
    };
}

function createIndexedCompletionItemFromFileSymbol(
    symbol: LuauFileSymbol,
): FileIndexedCompletionItem {
    const item = createCompletionItemFromFileSymbol(symbol);

    return {
        ...createIndexedCompletionItem(item),
        symbol,
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
    tokenStartIndex: number,
    currentFunctionOwner: number | null,
): boolean {
    if (symbol.kind === "comment") {
        return false;
    }

    if (
        symbol.visibleStart > cursorIndex ||
        (cursorIndex > symbol.visibleEnd && tokenStartIndex > symbol.visibleEnd)
    ) {
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

function createCompletionIndexByPriority(
    items: readonly LuauCompletionItem[],
    namespace = "",
): CompletionIndexByPriority {
    const indexedItems = items.map((item) =>
        createIndexedCompletionItem(item, namespace),
    );
    const indexByPriority = {} as CompletionIndexByPriority;

    for (const priority of LUAU_COMPLETION_INDEX_PRIORITIES) {
        indexByPriority[priority] = [...indexedItems].sort((left, right) =>
            compareIndexedCompletionItems(left, right, priority),
        );
    }

    return indexByPriority;
}

function createNamespaceIndex(): Map<string, CompletionIndexByPriority> {
    const namespaceItems = new Map<string, LuauCompletionItem[]>();

    for (const group of [
        ...LUAU_NAMESPACE_COMPLETIONS,
        ...ROBLOX_NAMESPACE_COMPLETIONS,
        ...SUNC_NAMESPACE_COMPLETIONS,
        ...UNC_NAMESPACE_COMPLETIONS,
        ...RAKNET_NAMESPACE_COMPLETIONS,
    ]) {
        const existingItems = namespaceItems.get(group.namespace) ?? [];

        namespaceItems.set(group.namespace, [...existingItems, ...group.items]);
    }

    const namespaceIndex = new Map<string, CompletionIndexByPriority>();

    for (const [namespace, items] of namespaceItems) {
        namespaceIndex.set(
            namespace,
            createCompletionIndexByPriority(
                dedupeCompletionItems(items, namespace),
                namespace,
            ),
        );
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
const LUAU_ROOT_COMPLETION_INDEX = createCompletionIndexByPriority(
    LUAU_ROOT_COMPLETIONS,
);

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

function compareIndexedCompletionItems(
    left: IndexedCompletionItem,
    right: IndexedCompletionItem,
    priority: AppIntellisensePriority,
): number {
    return compareCompletionItems(left.item, right.item, priority);
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

function insertTopCompletionItem(
    topItems: IndexedCompletionItem[],
    item: IndexedCompletionItem,
    priority: AppIntellisensePriority,
): void {
    let insertIndex = 0;

    while (
        insertIndex < topItems.length &&
        compareIndexedCompletionItems(topItems[insertIndex], item, priority) <=
            0
    ) {
        insertIndex += 1;
    }

    if (insertIndex >= MAX_LUAU_COMPLETION_ITEMS) {
        return;
    }

    topItems.splice(insertIndex, 0, item);

    if (topItems.length > MAX_LUAU_COMPLETION_ITEMS) {
        topItems.pop();
    }
}

function addMatchingCompletionItems(options: {
    items: readonly IndexedCompletionItem[];
    normalizedPrefix: string;
    priority: AppIntellisensePriority;
    seen: Set<string>;
    topItems: IndexedCompletionItem[];
}): void {
    const { items, normalizedPrefix, priority, seen, topItems } = options;

    for (const item of items) {
        if (seen.has(item.key)) {
            continue;
        }

        seen.add(item.key);

        addMatchingCompletionItem({
            item,
            normalizedPrefix,
            priority,
            topItems,
        });
    }
}

function addMatchingCompletionItem(options: {
    item: IndexedCompletionItem;
    normalizedPrefix: string;
    priority: AppIntellisensePriority;
    topItems: IndexedCompletionItem[];
}): void {
    const { item, normalizedPrefix, priority, topItems } = options;

    if (
        normalizedPrefix.length > 0 &&
        !item.normalizedLabel.startsWith(normalizedPrefix)
    ) {
        return;
    }

    insertTopCompletionItem(topItems, item, priority);
}

function filterCompletions(
    indexByPriority: CompletionIndexByPriority,
    prefix: string,
    priority: AppIntellisensePriority,
): LuauCompletionItem[] {
    const normalizedPrefix = prefix.toLowerCase();
    const items = indexByPriority[priority];

    if (normalizedPrefix.length === 0) {
        return items
            .slice(0, MAX_LUAU_COMPLETION_ITEMS)
            .map((indexedItem) => indexedItem.item);
    }

    const topItems: IndexedCompletionItem[] = [];

    addMatchingCompletionItems({
        items,
        normalizedPrefix,
        priority,
        seen: new Set<string>(),
        topItems,
    });

    return topItems.map((indexedItem) => indexedItem.item);
}

function getFileCompletionIndex(
    analysis: LuauFileAnalysis,
): FileIndexedCompletionItem[] {
    const cachedIndex = FILE_COMPLETION_INDEX_CACHE.get(analysis);

    if (cachedIndex) {
        return cachedIndex;
    }

    const index = analysis.symbols
        .filter((symbol) => symbol.kind !== "comment")
        .map(createIndexedCompletionItemFromFileSymbol)
        .sort((left, right) =>
            compareIndexedCompletionItems(left, right, "balanced"),
        );

    FILE_COMPLETION_INDEX_CACHE.set(analysis, index);

    return index;
}

function addVisibleFileCompletionItems(options: {
    analysis: LuauFileAnalysis | null;
    cursorIndex: number;
    normalizedPrefix: string;
    priority: AppIntellisensePriority;
    seen: Set<string>;
    topItems: IndexedCompletionItem[];
}): void {
    const {
        analysis,
        cursorIndex,
        normalizedPrefix,
        priority,
        seen,
        topItems,
    } = options;
    const tokenStartIndex = cursorIndex - normalizedPrefix.length;

    if (!analysis) {
        return;
    }

    const currentFunctionOwner = getInnermostFunctionOwner(
        analysis.functionScopes,
        cursorIndex,
    );

    for (const item of getFileCompletionIndex(analysis)) {
        if (
            !shouldIncludeFileSymbol(
                item.symbol,
                cursorIndex,
                tokenStartIndex,
                currentFunctionOwner,
            )
        ) {
            continue;
        }

        if (seen.has(item.key)) {
            continue;
        }

        seen.add(item.key);
        addMatchingCompletionItem({
            item,
            normalizedPrefix,
            priority,
            topItems,
        });
    }
}

/**
 * Builds a Luau completion query with matching items and replacement range from the cursor context.
 */
export function getLuauCompletionQuery(options: {
    analysis: LuauFileAnalysis | null;
    beforeCursor: string;
    cursorIndex: number;
    priority: AppIntellisensePriority;
}): LuauCompletionQuery {
    const { analysis, beforeCursor, cursorIndex, priority } = options;
    const namespacedMatch = beforeCursor.match(
        /([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\.([A-Za-z0-9_]*)$/,
    );

    if (namespacedMatch) {
        const [, namespacePath, prefix] = namespacedMatch;

        return {
            items: filterCompletions(
                LUAU_NAMESPACE_INDEX.get(namespacePath) ??
                    EMPTY_LUAU_COMPLETION_INDEX_BY_PRIORITY,
                prefix,
                priority,
            ),
            namespacePath,
            prefix,
            replaceStartColumn: beforeCursor.length - prefix.length,
            replaceEndColumn: beforeCursor.length,
        };
    }

    const rootPrefixMatch = beforeCursor.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    const prefix = rootPrefixMatch?.[1] ?? "";
    const normalizedPrefix = prefix.toLowerCase();
    const seen = new Set<string>();
    const topItems: IndexedCompletionItem[] = [];

    addVisibleFileCompletionItems({
        analysis,
        cursorIndex,
        normalizedPrefix,
        priority,
        seen,
        topItems,
    });
    addMatchingCompletionItems({
        items: LUAU_ROOT_COMPLETION_INDEX[priority],
        normalizedPrefix,
        priority,
        seen,
        topItems,
    });

    return {
        items: topItems.map((item) => item.item),
        namespacePath: null,
        prefix,
        replaceStartColumn: beforeCursor.length - prefix.length,
        replaceEndColumn: beforeCursor.length,
    };
}

/**
 * Returns whether the completion popup should open, hiding exact-only matches.
 */
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
