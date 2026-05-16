import { EMPTY_LUAU_COMPLETION_INDEX_BY_PRIORITY } from "../../../constants/luau/core/luauCompletionIndex";
import type { AppIntellisensePriority } from "../../app/app.type";
import type { LuauFileSymbol } from "../luau.type";
import type {
    LuauFileAnalysis,
    ScopeFrame,
} from "../symbolScanner/symbolScanner.type";
import type {
    FileIndexedCompletionItem,
    IndexedCompletionItem,
    LuauCompletionQuery,
} from "./completion.type";
import {
    addMatchingCompletionItem,
    addMatchingCompletionItems,
    compareIndexedCompletionItems,
    createCompletionItemsByFirstCharacter,
    createIndexedCompletionItemFromFileSymbol,
    getCompletionIndexItemsByPrefix,
    getFirstCompletionItemsByPrefix,
    LUAU_NAMESPACE_INDEX,
    LUAU_ROOT_COMPLETION_INDEX,
} from "./completionIndex";

type FileCompletionIndex = {
    functionScopesByStart: FunctionScopeIndexEntry[];
    items: FileIndexedCompletionItem[];
    itemsByFirstCharacter: Map<string, FileIndexedCompletionItem[]>;
};

type FunctionScopeIndexEntry = {
    maxEndThroughEntry: number;
    scope: ScopeFrame;
};

const FILE_COMPLETION_INDEX_CACHE = new WeakMap<
    LuauFileAnalysis,
    FileCompletionIndex
>();
const STALE_ANALYSIS_BOUNDARY_TOLERANCE = 1;

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

function shouldIncludeFileSymbol(
    symbol: LuauFileSymbol,
    cursorIndex: number,
    tokenStartIndex: number,
    currentFunctionOwner: number | null,
    namespace: string | null,
): boolean {
    if (symbol.kind === "comment" || symbol.kind === "loadstring") {
        return false;
    }

    if ((symbol.namespace ?? null) !== namespace) {
        return false;
    }

    if (
        symbol.visibleStart > cursorIndex ||
        (cursorIndex > symbol.visibleEnd &&
            tokenStartIndex >
                symbol.visibleEnd + STALE_ANALYSIS_BOUNDARY_TOLERANCE)
    ) {
        return false;
    }

    if (!symbol.isLexical) {
        return true;
    }

    return symbol.ownerFunctionStart === currentFunctionOwner;
}

function createFileCompletionIndex(
    analysis: LuauFileAnalysis,
): FileCompletionIndex {
    const items = analysis.symbols
        .flatMap((symbol) =>
            symbol.kind === "comment" || symbol.kind === "loadstring"
                ? []
                : [createIndexedCompletionItemFromFileSymbol(symbol)],
        )
        .sort((left, right) =>
            compareIndexedCompletionItems(left, right, "balanced"),
        );

    return {
        functionScopesByStart: createFunctionScopeIndex(
            analysis.functionScopes,
        ),
        items,
        itemsByFirstCharacter: createCompletionItemsByFirstCharacter(items),
    };
}

function createFunctionScopeIndex(
    functionScopes: readonly ScopeFrame[],
): FunctionScopeIndexEntry[] {
    let maxEndThroughEntry = Number.NEGATIVE_INFINITY;

    return functionScopes
        .toSorted((left, right) => left.start - right.start)
        .map((scope) => {
            maxEndThroughEntry = Math.max(maxEndThroughEntry, scope.end);

            return {
                maxEndThroughEntry,
                scope,
            };
        });
}

function getFileCompletionIndex(
    analysis: LuauFileAnalysis,
): FileCompletionIndex {
    const cachedIndex = FILE_COMPLETION_INDEX_CACHE.get(analysis);

    if (cachedIndex) {
        return cachedIndex;
    }

    const index = createFileCompletionIndex(analysis);

    FILE_COMPLETION_INDEX_CACHE.set(analysis, index);

    return index;
}

function getLastFunctionScopeStartBeforeCursor(
    functionScopes: readonly FunctionScopeIndexEntry[],
    cursorIndex: number,
): number {
    let leftIndex = 0;
    let rightIndex = functionScopes.length - 1;
    let resultIndex = -1;

    while (leftIndex <= rightIndex) {
        const middleIndex = Math.floor((leftIndex + rightIndex) / 2);
        const middleScope = functionScopes[middleIndex];

        if (!middleScope || middleScope.scope.start > cursorIndex) {
            rightIndex = middleIndex - 1;
            continue;
        }

        resultIndex = middleIndex;
        leftIndex = middleIndex + 1;
    }

    return resultIndex;
}

function getInnermostFunctionOwner(
    functionScopes: readonly FunctionScopeIndexEntry[],
    cursorIndex: number,
): number | null {
    const startIndex = getLastFunctionScopeStartBeforeCursor(
        functionScopes,
        cursorIndex,
    );

    for (let index = startIndex; index >= 0; index -= 1) {
        const entry = functionScopes[index];

        if (!entry || entry.maxEndThroughEntry < cursorIndex) {
            return null;
        }

        const { scope } = entry;

        if (cursorIndex <= scope.end) {
            return scope.start;
        }
    }

    return null;
}

function addVisibleFileCompletionItems(options: {
    analysis: LuauFileAnalysis | null;
    cursorIndex: number;
    expressionStartIndex: number;
    namespace: string | null;
    normalizedPrefix: string;
    priority: AppIntellisensePriority;
    seen: Set<string>;
    topItems: IndexedCompletionItem[];
}): void {
    const {
        analysis,
        cursorIndex,
        expressionStartIndex,
        namespace,
        normalizedPrefix,
        priority,
        seen,
        topItems,
    } = options;

    if (!analysis) {
        return;
    }

    const fileCompletionIndex = getFileCompletionIndex(analysis);
    const currentFunctionOwner = getInnermostFunctionOwner(
        fileCompletionIndex.functionScopesByStart,
        cursorIndex,
    );
    const matchingItems = getFirstCompletionItemsByPrefix(
        fileCompletionIndex.itemsByFirstCharacter,
        fileCompletionIndex.items,
        normalizedPrefix,
    );

    for (const item of matchingItems) {
        if (
            !shouldIncludeFileSymbol(
                item.symbol,
                cursorIndex,
                expressionStartIndex,
                currentFunctionOwner,
                namespace,
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
        const normalizedPrefix = prefix.toLowerCase();
        const expressionStartIndex =
            cursorIndex - namespacePath.length - 1 - prefix.length;
        const seen = new Set<string>();
        const topItems: IndexedCompletionItem[] = [];

        addVisibleFileCompletionItems({
            analysis,
            cursorIndex,
            expressionStartIndex,
            namespace: namespacePath,
            normalizedPrefix,
            priority,
            seen,
            topItems,
        });
        addMatchingCompletionItems({
            items: getCompletionIndexItemsByPrefix(
                LUAU_NAMESPACE_INDEX.get(namespacePath) ??
                    EMPTY_LUAU_COMPLETION_INDEX_BY_PRIORITY,
                priority,
                normalizedPrefix,
            ),
            normalizedPrefix,
            priority,
            seen,
            topItems,
        });

        return {
            items: topItems.map((item) => item.item),
            namespacePath,
            prefix,
            replaceStartColumn: beforeCursor.length - prefix.length,
            replaceEndColumn: beforeCursor.length,
        };
    }

    const rootPrefixMatch = beforeCursor.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    const prefix = rootPrefixMatch?.[1] ?? "";
    const normalizedPrefix = prefix.toLowerCase();
    const expressionStartIndex = cursorIndex - prefix.length;
    const seen = new Set<string>();
    const topItems: IndexedCompletionItem[] = [];

    addVisibleFileCompletionItems({
        analysis,
        cursorIndex,
        expressionStartIndex,
        namespace: null,
        normalizedPrefix,
        priority,
        seen,
        topItems,
    });
    addMatchingCompletionItems({
        items: getCompletionIndexItemsByPrefix(
            LUAU_ROOT_COMPLETION_INDEX,
            priority,
            normalizedPrefix,
        ),
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
