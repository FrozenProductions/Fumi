import type { LuauFileSymbol } from "./luau.type";

export type LuauToken = {
    end: number;
    start: number;
    type: "identifier" | "newline" | "number" | "symbol";
    value: string;
};

export type ScopeFrame = {
    end: number;
    start: number;
};

export type LuauFileAnalysis = {
    functionScopes: ScopeFrame[];
    symbols: LuauFileSymbol[];
};

export const EMPTY_LUAU_FILE_ANALYSIS: LuauFileAnalysis = {
    functionScopes: [],
    symbols: [],
};

export type LuauScanMode = "full" | "functions";

export type PendingLuauFileSymbol = Omit<
    LuauFileSymbol,
    | "ownerFunctionEnd"
    | "ownerFunctionStart"
    | "scopeEnd"
    | "scopeStart"
    | "visibleEnd"
> & {
    ownerFunction: ScopeFrame | null;
    scope: ScopeFrame;
};

export type TokenBoundary = {
    end: number;
    start: number;
};
