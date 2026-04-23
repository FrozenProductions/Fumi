import type {
    LuauCompletionItem,
    LuauNamespaceCompletionGroup,
} from "../luau.type";
import type {
    CreateLuauCompletionItemOptions,
    LuauCompletionOptions,
} from "./completionBuilder.type";

/**
 * Strips Markdown links, bold, and code backticks from a Luau doc summary.
 */
export function normalizeLuauMarkdownSummary(summary: string): string {
    return summary
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Collapses consecutive whitespace in a Luau doc summary into single spaces.
 */
export function normalizeLuauWhitespaceSummary(summary: string): string {
    return summary.replace(/\s+/g, " ").trim();
}

/**
 * Creates a single Luau completion item with label, doc, and insertion metadata.
 */
export function createLuauCompletionItem(
    label: string,
    summary: string,
    {
        detail,
        insertText,
        kind = "function",
        namespace,
        score,
        signature,
        source,
        sourceGroup,
        sourceLink,
        includeSourceLinkInSummary = false,
        summaryNormalizer,
    }: CreateLuauCompletionItemOptions,
): LuauCompletionItem {
    const normalizedSummary = summaryNormalizer
        ? summaryNormalizer(summary)
        : summary;

    const docSummary =
        includeSourceLinkInSummary && sourceLink
            ? `${normalizedSummary} Link: ${sourceLink}`
            : normalizedSummary;

    return {
        label,
        kind,
        detail,
        doc: {
            summary: docSummary,
            source,
            signature,
        },
        insertText,
        namespace,
        score,
        sourceGroup,
    };
}

/**
 * Creates a completion item for a Luau alias, noting the canonical name in the summary.
 */
export function createLuauCompletionAliasItem(
    alias: string,
    canonicalName: string,
    summary: string,
    options: CreateLuauCompletionItemOptions,
): LuauCompletionItem {
    return createLuauCompletionItem(
        alias,
        `Alias of ${canonicalName}. ${summary}`,
        options,
    );
}

/**
 * Creates a language-scope completion item (keywords, types, constants) with source group "language".
 */
export function createLuauLanguageCompletionItem(
    label: string,
    kind: LuauCompletionItem["kind"],
    detail: string,
    summary: string,
    source: string,
    options?: Omit<LuauCompletionOptions, "kind">,
): LuauCompletionItem {
    return createLuauCompletionItem(label, summary, {
        detail,
        kind,
        source,
        sourceGroup: "language",
        insertText: options?.insertText,
        namespace: options?.namespace,
        score: options?.score,
        signature: options?.signature,
        sourceLink: options?.sourceLink,
        includeSourceLinkInSummary: options?.includeSourceLinkInSummary,
        summaryNormalizer: options?.summaryNormalizer,
    });
}

/**
 * Groups namespace completion items under a shared namespace path.
 */
export function createLuauNamespaceCompletionGroup(
    namespace: string,
    items: LuauCompletionItem[],
): LuauNamespaceCompletionGroup {
    return {
        namespace,
        items,
    };
}
