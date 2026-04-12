import type { LuauFileSymbol } from "../../lib/luau/luau.type";

export type UseWorkspaceOutlineResult = {
    canRefreshFullSymbols: boolean;
    isShowingFunctionsOnly: boolean;
    refreshFullSymbols: () => void;
    symbols: LuauFileSymbol[];
};
