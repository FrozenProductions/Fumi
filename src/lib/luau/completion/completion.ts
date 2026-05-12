import { EMPTY_LUAU_COMPLETION_INDEX_BY_PRIORITY } from "../../../constants/luau/core/luauCompletionIndex";
import type { AppIntellisensePriority } from "../../app/app.type";
import type { LuauFileSymbol } from "../luau.type";
import type { LuauFileAnalysis } from "../symbolScanner/symbolScanner.type";
import type {
    FileIndexedCompletionItem,
    IndexedCompletionItem,
    LuauCompletionQuery,
} from "./completion.type";
import {
    addMatchingCompletionItem,
    addMatchingCompletionItems,
    compareIndexedCompletionItems,
    createIndexedCompletionItemFromFileSymbol,
    LUAU_NAMESPACE_INDEX,
    LUAU_ROOT_COMPLETION_INDEX,
} from "./completionIndex";

const FILE_COMPLETION_INDEX_CACHE = new WeakMap<
    LuauFileAnalysis,
    FileIndexedCompletionItem[]
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

function getFileCompletionIndex(
    analysis: LuauFileAnalysis,
): FileIndexedCompletionItem[] {
    const cachedIndex = FILE_COMPLETION_INDEX_CACHE.get(analysis);

    if (cachedIndex) {
        return cachedIndex;
    }

    const index = analysis.symbols
        .filter(
            (symbol) =>
                symbol.kind !== "comment" && symbol.kind !== "loadstring",
        )
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

    const currentFunctionOwner = getInnermostFunctionOwner(
        analysis.functionScopes,
        cursorIndex,
    );

    for (const item of getFileCompletionIndex(analysis)) {
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
            items:
                LUAU_NAMESPACE_INDEX.get(namespacePath)?.[priority] ??
                EMPTY_LUAU_COMPLETION_INDEX_BY_PRIORITY[priority],
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
