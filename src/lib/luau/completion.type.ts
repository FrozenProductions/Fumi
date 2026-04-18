import type { LuauCompletionItem } from "../../lib/luau/luau.type";

export type LuauCompletionQuery = {
    items: LuauCompletionItem[];
    namespacePath: string | null;
    prefix: string;
    replaceStartColumn: number;
    replaceEndColumn: number;
};

export type LuauKeywordDocs = Record<string, string>;

export type LuauTypeDocs = Record<string, string>;
