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

export const UNC_NAMESPACE_NAMES = Array.from(
    new Set(UNC_NAMESPACE_DATA.map(([namespace]) => namespace.split(".")[0])),
);

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
    Array.from(new Set(UNC_NAMESPACE_DATA.map(([namespace]) => namespace))).map(
        (namespace) =>
            createLuauNamespaceCompletionGroup(
                namespace,
                UNC_NAMESPACE_DATA.filter(
                    ([candidateNamespace]) => candidateNamespace === namespace,
                ).map(
                    ([
                        candidateNamespace,
                        memberName,
                        category,
                        summary,
                        signature,
                        link,
                    ]) =>
                        createLuauCompletionItem(memberName, summary, {
                            detail: `unc ${category}`,
                            kind: signature.startsWith("namespace ")
                                ? "namespace"
                                : memberName === "Fonts"
                                  ? "constant"
                                  : "function",
                            namespace: candidateNamespace,
                            score: signature.startsWith("namespace ")
                                ? 1140
                                : 1130,
                            signature,
                            source: UNC_DOC_SOURCE,
                            sourceGroup: "executor",
                            sourceLink: link,
                            includeSourceLinkInSummary: true,
                            summaryNormalizer: normalizeLuauWhitespaceSummary,
                        }),
                ),
            ),
    );
