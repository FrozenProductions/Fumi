import type { LuauFileSymbol } from "../../luau/luau.type";

export type WorkspaceOutlineGroup = {
    symbols: LuauFileSymbol[];
    title: string;
};

export type WorkspaceOutlineSearchFieldName =
    | "detail"
    | "group"
    | "kind"
    | "label";
