import type {
    CreateLuauCompletionItemOptions,
    LuauCompletionOptions,
} from "./completionBuilder.type";
import type {
    LuauCompletionItem,
    LuauNamespaceCompletionGroup,
} from "./luau.type";

export function normalizeLuauMarkdownSummary(summary: string): string {
    return summary
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function normalizeLuauWhitespaceSummary(summary: string): string {
    return summary.replace(/\s+/g, " ").trim();
}

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

export function createLuauNamespaceCompletionGroup(
    namespace: string,
    items: LuauCompletionItem[],
): LuauNamespaceCompletionGroup {
    return {
        namespace,
        items,
    };
}
