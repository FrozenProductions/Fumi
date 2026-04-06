import type { LuauCompletionItem } from "../../lib/luau/luau.type";

export type LuauCompletionQuery = {
    items: LuauCompletionItem[];
    namespacePath: string | null;
    prefix: string;
    replaceStartColumn: number;
    replaceEndColumn: number;
};
