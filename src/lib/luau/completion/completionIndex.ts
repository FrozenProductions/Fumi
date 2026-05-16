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
    const sortedItemsByPriority = new Map<
        AppIntellisensePriority,
        IndexedCompletionItem[]
    >();

    for (const priority of LUAU_COMPLETION_INDEX_PRIORITIES) {
        Object.defineProperty(indexByPriority, priority, {
            enumerable: true,
            get: () => {
                const cachedItems = sortedItemsByPriority.get(priority);

                if (cachedItems) {
                    return cachedItems;
                }

                const sortedItems = indexedItems.toSorted((left, right) =>
                    compareIndexedCompletionItems(left, right, priority),
                );

                sortedItemsByPriority.set(priority, sortedItems);

                return sortedItems;
            },
        });
    }

    return indexByPriority;
}

function getNamespaceCompletionGroups(): readonly {
    items: readonly LuauCompletionItem[];
    namespace: string;
}[] {
    return [
        ...LUAU_NAMESPACE_COMPLETIONS,
        ...ROBLOX_NAMESPACE_COMPLETIONS,
        ...SUNC_NAMESPACE_COMPLETIONS,
        ...UNC_NAMESPACE_COMPLETIONS,
        ...RAKNET_NAMESPACE_COMPLETIONS,
    ];
}

function appendNamespaceItems(
    namespaceItems: Map<string, LuauCompletionItem[]>,
    namespace: string,
    items: readonly LuauCompletionItem[],
): void {
    const existingItems = namespaceItems.get(namespace);

    if (existingItems) {
        existingItems.push(...items);
        return;
    }

    namespaceItems.set(namespace, [...items]);
}

function getCompletionItemsByPrefix<TItem extends IndexedCompletionItem>(
    items: readonly TItem[],
    normalizedPrefix: string,
): readonly TItem[] {
    if (normalizedPrefix.length === 0) {
        return items;
    }

    return items.filter((item) =>
        item.normalizedLabel.startsWith(normalizedPrefix),
    );
}

/**
 * Retrieves completion items matching a prefix using a first-character index for fast lookup.
 *
 * @param itemsByFirstCharacter - Pre-built index mapping first characters to items
 * @param items - Fallback items when prefix is empty
 * @param normalizedPrefix - The normalized prefix to search for
 * @returns Matching completion items
 */
export function getFirstCompletionItemsByPrefix<
    TItem extends IndexedCompletionItem,
>(
    itemsByFirstCharacter: ReadonlyMap<string, readonly TItem[]>,
    items: readonly TItem[],
    normalizedPrefix: string,
): readonly TItem[] {
    if (normalizedPrefix.length === 0) {
        return items;
    }

    return getCompletionItemsByPrefix(
        itemsByFirstCharacter.get(normalizedPrefix[0]) ?? [],
        normalizedPrefix,
    );
}

/**
 * Creates an index mapping the first character of each item's normalized label to its items.
 *
 * @param items - Completion items to index
 * @returns Map from first character to array of items starting with that character
 */
export function createCompletionItemsByFirstCharacter<
    TItem extends IndexedCompletionItem,
>(items: readonly TItem[]): Map<string, TItem[]> {
    const itemsByFirstCharacter = new Map<string, TItem[]>();

    for (const item of items) {
        const firstCharacter = item.normalizedLabel[0] ?? "";
        const existingItems = itemsByFirstCharacter.get(firstCharacter);

        if (existingItems) {
            existingItems.push(item);
            continue;
        }

        itemsByFirstCharacter.set(firstCharacter, [item]);
    }

    return itemsByFirstCharacter;
}

/**
 * Retrieves completion items from a priority index matching the given prefix.
 *
 * @param index - The completion index organized by priority level
 * @param priority - The priority level to query
 * @param normalizedPrefix - The normalized prefix to search for
 * @returns Matching completion items at the specified priority
 */
export function getCompletionIndexItemsByPrefix(
    index: CompletionIndexByPriority,
    priority: AppIntellisensePriority,
    normalizedPrefix: string,
): readonly IndexedCompletionItem[] {
    return getCompletionItemsByPrefix(index[priority], normalizedPrefix);
}

function createNamespaceIndex(): Map<string, CompletionIndexByPriority> {
    const namespaceItems = new Map<string, LuauCompletionItem[]>();

    for (const group of getNamespaceCompletionGroups()) {
        appendNamespaceItems(namespaceItems, group.namespace, group.items);
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
 * Pre-built index of Luau namespace completions organized by priority.
 *
 * Contains all standard library functions and types grouped by their namespace
 * (e.g., `string`, `table`, `math`) for efficient intellisense lookup.
 */
export const LUAU_NAMESPACE_INDEX = createNamespaceIndex();

/**
 * Pre-built index of root-level Luau completions organized by priority.
 *
 * Contains keywords, built-in types, and global functions available at the
 * top level of any Luau file without namespace qualification.
 */
export const LUAU_ROOT_COMPLETION_INDEX = createCompletionIndexByPriority(
    LUAU_ROOT_COMPLETIONS,
);
