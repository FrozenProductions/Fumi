import { RAKNET_NAMESPACE_COMPLETIONS } from "../../../constants/luau/community/raknetCompletions";
import { MAX_LUAU_COMPLETION_ITEMS } from "../../../constants/luau/core/luau";
import { LUAU_COMPLETION_INDEX_PRIORITIES } from "../../../constants/luau/core/luauCompletionIndex";
import { LUAU_NAMESPACE_COMPLETIONS } from "../../../constants/luau/core/namespaces/luauNamespaceCompletions";
import { ROBLOX_NAMESPACE_COMPLETIONS } from "../../../constants/luau/roblox/robloxNamespaceCompletions";
import { SUNC_NAMESPACE_COMPLETIONS } from "../../../constants/luau/sunc/suncCompletions";
import { UNC_NAMESPACE_COMPLETIONS } from "../../../constants/luau/unc/uncCompletions";
import type { AppIntellisensePriority } from "../../app/app.type";
import type { LuauCompletionItem, LuauFileSymbol } from "../luau.type";
import type {
    CompletionIndexByPriority,
    FileIndexedCompletionItem,
    IndexedCompletionItem,
} from "./completion.type";
import {
    dedupeCompletionItems,
    LUAU_ROOT_COMPLETIONS,
} from "./completionRootCompletions";

function createCompletionItemFromFileSymbol(
    symbol: LuauFileSymbol,
): LuauCompletionItem {
    return {
        label: symbol.label,
        kind: symbol.kind,
        detail: symbol.detail,
        doc: symbol.doc,
        insertText: symbol.insertText,
        namespace: symbol.namespace,
        score: symbol.score,
        sourceGroup: "file",
    };
}

function getIndexedCompletionKey(
    item: LuauCompletionItem,
    namespace = item.namespace ?? "",
): string {
    return `${namespace.toLowerCase()}::${item.label.toLowerCase()}`;
}

function createIndexedCompletionItem(
    item: LuauCompletionItem,
    namespace = item.namespace ?? "",
): IndexedCompletionItem {
    return {
        item,
        key: getIndexedCompletionKey(item, namespace),
        normalizedLabel: item.label.toLowerCase(),
    };
}

/**
 * Creates an indexed completion item from a file symbol, preserving the original symbol for re-export.
 *
 * @param symbol - The file symbol to index
 * @returns An indexed completion item with lookup key, normalized label, and the source symbol
 */
export function createIndexedCompletionItemFromFileSymbol(
    symbol: LuauFileSymbol,
): FileIndexedCompletionItem {
    const item = createCompletionItemFromFileSymbol(symbol);

    return {
        ...createIndexedCompletionItem(item),
        symbol,
    };
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

/**
 * Compares two indexed completion items for sorted insertion based on source group weight, score, and label.
 *
 * @param left - First indexed item
 * @param right - Second indexed item
 * @param priority - The active intellisense priority context
 * @returns Negative if left comes before right, positive if after, zero if equal
 */
export function compareIndexedCompletionItems(
    left: IndexedCompletionItem,
    right: IndexedCompletionItem,
    priority: AppIntellisensePriority,
): number {
    return compareCompletionItems(left.item, right.item, priority);
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

/**
 * Inserts a single indexed item into the top-items list if it matches the prefix and ranks high enough.
 *
 * @param options.item - The indexed completion item to evaluate
 * @param options.normalizedPrefix - Lowercase prefix to match against the item label
 * @param options.priority - Active intellisense priority for comparison
 * @param options.topItems - Mutable sorted list of top candidates (truncated to max items)
 */
export function addMatchingCompletionItem(options: {
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

/**
 * Iterates a list of indexed items, inserting each match into the top-items list while deduplicating by key.
 *
 * @param options.items - Readonly list of indexed completion items to scan
 * @param options.normalizedPrefix - Lowercase prefix to match against item labels
 * @param options.priority - Active intellisense priority for comparison
 * @param options.seen - Set of already-processed keys for deduplication
 * @param options.topItems - Mutable sorted list of top candidates
 */
export function addMatchingCompletionItems(options: {
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

/**
 * Filters a pre-sorted completion index by prefix, returning at most MAX_LUAU_COMPLETION_ITEMS results.
 *
 * @param indexByPriority - The completion index for the active priority
 * @param prefix - Raw typed prefix (case-insensitive)
 * @param priority - Active intellisense priority
 * @returns Filtered completion items sorted by relevance
 */
export function filterCompletions(
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

export const LUAU_NAMESPACE_INDEX = createNamespaceIndex();
export const LUAU_ROOT_COMPLETION_INDEX = createCompletionIndexByPriority(
    LUAU_ROOT_COMPLETIONS,
);
