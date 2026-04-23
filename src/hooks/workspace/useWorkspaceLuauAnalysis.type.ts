import type { LuauFileSymbol } from "../../lib/luau/luau.type";
import type { LuauFileAnalysis } from "../../lib/luau/symbolScanner/symbolScanner.type";

export type UseWorkspaceLuauAnalysisResult = {
    analysis: LuauFileAnalysis | null;
    symbols: LuauFileSymbol[];
};
