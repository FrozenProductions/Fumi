import type {
    LuauCompletionItem,
    LuauCompletionSourceGroup,
} from "../luau.type";

export type LuauCompletionOptions = {
    insertText?: string;
    kind?: LuauCompletionItem["kind"];
    namespace?: string;
    score?: number;
    signature?: string;
    sourceLink?: string;
    includeSourceLinkInSummary?: boolean;
    summaryNormalizer?: (summary: string) => string;
};

export type CreateLuauCompletionItemOptions = LuauCompletionOptions & {
    detail: string;
    source: string;
    sourceGroup: LuauCompletionSourceGroup;
};
