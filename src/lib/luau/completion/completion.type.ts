import type { AppIntellisensePriority } from "../../app/app.type";
import type { LuauCompletionItem, LuauFileSymbol } from "../luau.type";

export type IndexedCompletionItem = {
    item: LuauCompletionItem;
    key: string;
    normalizedLabel: string;
};

export type FileIndexedCompletionItem = IndexedCompletionItem & {
    symbol: LuauFileSymbol;
};

export type CompletionIndexByPriority = Record<
    AppIntellisensePriority,
    IndexedCompletionItem[]
>;

export type LuauCompletionQuery = {
    items: LuauCompletionItem[];
    namespacePath: string | null;
    prefix: string;
    replaceStartColumn: number;
    replaceEndColumn: number;
};

export type LuauKeywordDocs = Record<string, string>;

export type LuauTypeDocs = Record<string, string>;
