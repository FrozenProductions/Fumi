import type { LuauFileAnalysis, LuauScanMode } from "./symbolScanner.type";
import { LuauSymbolScanner } from "./symbolScannerEngine";

let lastScannedContent = "";
let lastScannedMode: LuauScanMode = "full";
let lastScannedAnalysis: LuauFileAnalysis = {
    functionScopes: [],
    symbols: [],
};

/**
 * Scans Luau source content and returns file analysis with symbols and function scopes.
 *
 * @remarks
 * Caches the last result and returns it when called with identical content and mode.
 */
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
