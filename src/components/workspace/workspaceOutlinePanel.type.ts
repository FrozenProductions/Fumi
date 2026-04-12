import type { LuauFileSymbol } from "../../lib/luau/luau.type";

export type WorkspaceOutlinePanelProps = {
    canRefreshFullSymbols: boolean;
    isShowingFunctionsOnly: boolean;
    onRefreshFullSymbols: () => void;
    symbols: LuauFileSymbol[];
    onSelectSymbol: (symbol: LuauFileSymbol) => void;
};
