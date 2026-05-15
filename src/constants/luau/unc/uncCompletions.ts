import {
    createLuauCompletionAliasItem,
    createLuauCompletionItem,
    createLuauNamespaceCompletionGroup,
    normalizeLuauWhitespaceSummary,
} from "../../../lib/luau/completion/completionBuilder";
import type {
    LuauCompletionItem,
    LuauNamespaceCompletionGroup,
} from "../../../lib/luau/luau.type";
import { UNC_TOP_LEVEL_DATA } from "./topLevel/uncTopLevelData";
import { UNC_ALIAS_DATA } from "./uncAliasData";
import { UNC_DOC_SOURCE } from "./uncCompletionSources";
import { UNC_NAMESPACE_DATA } from "./uncNamespaceData";
import { UNC_NAMESPACE_SUMMARIES } from "./uncNamespaceSummaries";

export const UNC_GLOBAL_FUNCTION_NAMES = [
    ...UNC_TOP_LEVEL_DATA.map(([label]) => label),
    ...UNC_ALIAS_DATA.map(([alias]) => alias),
] as const;

const uncNamespaceNames = new Set<string>();
const uncNamespaceCompletionItemsByNamespace = new Map<
    string,
    LuauCompletionItem[]
>();

for (const [
    namespace,
    memberName,
    category,
    summary,
    signature,
    link,
] of UNC_NAMESPACE_DATA) {
    uncNamespaceNames.add(namespace.split(".")[0] ?? namespace);

    const completionItems =
        uncNamespaceCompletionItemsByNamespace.get(namespace) ?? [];
    completionItems.push(
        createLuauCompletionItem(memberName, summary, {
            detail: `unc ${category}`,
            kind: signature.startsWith("namespace ")
                ? "namespace"
                : memberName === "Fonts"
                  ? "constant"
                  : "function",
            namespace,
            score: signature.startsWith("namespace ") ? 1140 : 1130,
            signature,
            source: UNC_DOC_SOURCE,
            sourceGroup: "executor",
            sourceLink: link,
            includeSourceLinkInSummary: true,
            summaryNormalizer: normalizeLuauWhitespaceSummary,
        }),
    );
    uncNamespaceCompletionItemsByNamespace.set(namespace, completionItems);
}

export const UNC_NAMESPACE_NAMES = Array.from(uncNamespaceNames);

export const UNC_TOP_LEVEL_COMPLETIONS: LuauCompletionItem[] = [
    ...UNC_NAMESPACE_SUMMARIES.map(
        ([label, category, summary, signature, link]) =>
            createLuauCompletionItem(label, summary, {
                detail: `unc ${category}`,
                kind: "namespace",
                score: 1140,
                signature,
                source: UNC_DOC_SOURCE,
                sourceGroup: "executor",
                sourceLink: link,
                includeSourceLinkInSummary: true,
                summaryNormalizer: normalizeLuauWhitespaceSummary,
            }),
    ),
    ...UNC_TOP_LEVEL_DATA.map(([label, category, summary, signature, link]) =>
        createLuauCompletionItem(label, summary, {
            detail: `unc ${category}`,
            kind: "function",
            score: 1130,
            signature,
            source: UNC_DOC_SOURCE,
            sourceGroup: "executor",
            sourceLink: link,
            includeSourceLinkInSummary: true,
            summaryNormalizer: normalizeLuauWhitespaceSummary,
        }),
    ),
    ...UNC_ALIAS_DATA.map(
        ([alias, canonicalName, category, summary, signature, link]) =>
            createLuauCompletionAliasItem(alias, canonicalName, summary, {
                detail: `unc alias (${category})`,
                kind: "function",
                score: 1110,
                signature,
                source: UNC_DOC_SOURCE,
                sourceGroup: "executor",
                sourceLink: link,
                includeSourceLinkInSummary: true,
                summaryNormalizer: normalizeLuauWhitespaceSummary,
            }),
    ),
];

export const UNC_NAMESPACE_COMPLETIONS: LuauNamespaceCompletionGroup[] =
    Array.from(uncNamespaceCompletionItemsByNamespace, ([namespace, items]) =>
        createLuauNamespaceCompletionGroup(namespace, items),
    );
