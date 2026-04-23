import type { LuauFileAnalysis, LuauScanMode } from "./symbolScanner.type";
import { LuauSymbolScanner } from "./symbolScannerEngine";

let lastScannedContent = "";
let lastScannedMode: LuauScanMode = "full";
let lastScannedAnalysis: LuauFileAnalysis = {
    functionScopes: [],
    symbols: [],
};

export function scanLuauFileAnalysis(
    content: string,
    options?: {
        mode?: LuauScanMode;
    },
): LuauFileAnalysis {
    const mode = options?.mode ?? "full";

    if (content === lastScannedContent && mode === lastScannedMode) {
        return lastScannedAnalysis;
    }

    const scanner = new LuauSymbolScanner(content, mode);
    lastScannedContent = content;
    lastScannedMode = mode;
    lastScannedAnalysis = scanner.scan();
    return lastScannedAnalysis;
}
