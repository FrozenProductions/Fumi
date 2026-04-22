import {
    createLuauCompletionItem,
    createLuauNamespaceCompletionGroup,
    normalizeLuauMarkdownSummary,
} from "../../../lib/luau/completionBuilder";
import type {
    LuauCompletionItem,
    LuauNamespaceCompletionGroup,
} from "../../../lib/luau/luau.type";
import { SUNC_DOC_SOURCE } from "./suncCompletionSources";
import { SUNC_DEBUG_DATA } from "./suncDebugData";
import { SUNC_GLOBAL_DATA } from "./suncGlobalData";

export const SUNC_GLOBAL_FUNCTION_NAMES = SUNC_GLOBAL_DATA.map(
    ([name]) => name,
);

export const SUNC_NAMESPACE_NAMES = ["debug"] as const;

export const SUNC_NAMESPACE_FUNCTION_NAMES = SUNC_DEBUG_DATA.map(
    ([memberName]) => memberName,
);

export const SUNC_TOP_LEVEL_COMPLETIONS: LuauCompletionItem[] = [
    createLuauCompletionItem(
        "debug",
        "sUNC debug inspection and mutation helpers.",
        {
            detail: "sunc Debug",
            kind: "namespace",
            score: 1180,
            signature: "namespace debug",
            source: SUNC_DOC_SOURCE,
            sourceGroup: "executor",
            sourceLink: "https://docs.sunc.su/Debug",
            includeSourceLinkInSummary: true,
            summaryNormalizer: normalizeLuauMarkdownSummary,
        },
    ),
    ...SUNC_GLOBAL_DATA.map(([name, category, summary, signature, link]) =>
        createLuauCompletionItem(name, summary, {
            detail: `sunc ${category}`,
            kind: "function",
            score: 1170,
            signature,
            source: SUNC_DOC_SOURCE,
            sourceGroup: "executor",
            sourceLink: link,
            includeSourceLinkInSummary: true,
            summaryNormalizer: normalizeLuauMarkdownSummary,
        }),
    ),
];

export const SUNC_NAMESPACE_COMPLETIONS: LuauNamespaceCompletionGroup[] = [
    createLuauNamespaceCompletionGroup(
        "debug",
        SUNC_DEBUG_DATA.map(([memberName, summary, signature, link]) =>
            createLuauCompletionItem(memberName, summary, {
                detail: "sunc Debug",
                kind: "function",
                namespace: "debug",
                score: 1170,
                signature,
                source: SUNC_DOC_SOURCE,
                sourceGroup: "executor",
                sourceLink: link,
                includeSourceLinkInSummary: true,
                summaryNormalizer: normalizeLuauMarkdownSummary,
            }),
        ),
    ),
];
