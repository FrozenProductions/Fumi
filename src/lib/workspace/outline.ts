import { WORKSPACE_OUTLINE_CACHE_MAX_ENTRIES } from "../../constants/workspace/outline";
import type { LuauFileAnalysis } from "../luau/symbolScanner.type";
import type {
    WorkspaceIncrementalOutlineUpdateOptions,
    WorkspaceOutlineCacheEntry,
} from "./outline.type";

const STRUCTURAL_TEXT_PATTERN =
    /\b(local|function|export|for|while|repeat|until|if|elseif|else|do|end)\b|[={}()[\]]/u;

export function getWorkspaceOutlineCacheHit(
    cache: Map<string, WorkspaceOutlineCacheEntry>,
    tabId: string,
    fileName: string,
    contentHash: string,
    contentLength: number,
): WorkspaceOutlineCacheEntry | null {
    const entry = cache.get(tabId);

    if (!entry) {
        return null;
    }

    if (
        entry.fileName !== fileName ||
        entry.contentHash !== contentHash ||
        entry.contentLength !== contentLength
    ) {
        return null;
    }

    return entry;
}

export function storeWorkspaceOutlineCacheEntry(
    cache: Map<string, WorkspaceOutlineCacheEntry>,
    tabId: string,
    entry: WorkspaceOutlineCacheEntry,
    maxEntries = WORKSPACE_OUTLINE_CACHE_MAX_ENTRIES,
): void {
    if (cache.has(tabId)) {
        cache.delete(tabId);
    }

    cache.set(tabId, entry);

    while (cache.size > maxEntries) {
        const oldestKey = cache.keys().next().value;

        if (oldestKey === undefined) {
            return;
        }

        cache.delete(oldestKey);
    }
}

export function incrementallyUpdateWorkspaceOutline({
    change,
    nextContent,
    previousAnalysis,
    previousContent,
}: WorkspaceIncrementalOutlineUpdateOptions): LuauFileAnalysis | null {
    const startOffset = getOffsetFromPoint(previousContent, change.start);
    const endOffset = getOffsetFromPoint(previousContent, change.end);

    if (startOffset === null || endOffset === null || startOffset > endOffset) {
        return null;
    }

    const insertedText = change.lines.join("\n");
    const removedText = previousContent.slice(startOffset, endOffset);

    if (
        STRUCTURAL_TEXT_PATTERN.test(insertedText) ||
        STRUCTURAL_TEXT_PATTERN.test(removedText)
    ) {
        return null;
    }

    if (
        previousAnalysis.symbols.some((symbol) =>
            rangesOverlap(
                symbol.declarationStart,
                symbol.declarationEnd,
                startOffset,
                endOffset,
            ),
        )
    ) {
        return null;
    }

    if (
        previousContent.slice(0, startOffset) +
            insertedText +
            previousContent.slice(endOffset) !==
        nextContent
    ) {
        return null;
    }

    const delta = insertedText.length - (endOffset - startOffset);

    if (delta === 0) {
        return previousAnalysis;
    }

    return {
        functionScopes: previousAnalysis.functionScopes.map((scope) => ({
            start: shiftBoundary(scope.start, startOffset, endOffset, delta),
            end: shiftBoundary(scope.end, startOffset, endOffset, delta),
        })),
        symbols: previousAnalysis.symbols.map((symbol) => ({
            ...symbol,
            declarationStart: shiftBoundary(
                symbol.declarationStart,
                startOffset,
                endOffset,
                delta,
            ),
            declarationEnd: shiftBoundary(
                symbol.declarationEnd,
                startOffset,
                endOffset,
                delta,
            ),
            ownerFunctionStart:
                symbol.ownerFunctionStart === null
                    ? null
                    : shiftBoundary(
                          symbol.ownerFunctionStart,
                          startOffset,
                          endOffset,
                          delta,
                      ),
            ownerFunctionEnd:
                symbol.ownerFunctionEnd === null
                    ? null
                    : shiftBoundary(
                          symbol.ownerFunctionEnd,
                          startOffset,
                          endOffset,
                          delta,
                      ),
            scopeStart: shiftBoundary(
                symbol.scopeStart,
                startOffset,
                endOffset,
                delta,
            ),
            scopeEnd: shiftBoundary(
                symbol.scopeEnd,
                startOffset,
                endOffset,
                delta,
            ),
            visibleStart: shiftBoundary(
                symbol.visibleStart,
                startOffset,
                endOffset,
                delta,
            ),
            visibleEnd: shiftBoundary(
                symbol.visibleEnd,
                startOffset,
                endOffset,
                delta,
            ),
        })),
    };
}

function getOffsetFromPoint(
    content: string,
    point: {
        column: number;
        row: number;
    },
): number | null {
    if (point.row < 0 || point.column < 0) {
        return null;
    }

    let currentRow = 0;
    let index = 0;

    while (currentRow < point.row && index <= content.length) {
        const nextNewlineIndex = content.indexOf("\n", index);

        if (nextNewlineIndex === -1) {
            return null;
        }

        index = nextNewlineIndex + 1;
        currentRow += 1;
    }

    return Math.min(index + point.column, content.length);
}

function rangesOverlap(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
): boolean {
    return startA < endB && startB < endA;
}

function shiftBoundary(
    value: number,
    startOffset: number,
    endOffset: number,
    delta: number,
): number {
    if (value <= startOffset) {
        return value;
    }

    if (value >= endOffset) {
        return value + delta;
    }

    return startOffset + delta;
}
