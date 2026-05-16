import { LuauSymbolScannerBlocks } from "./parser/symbolScannerBlocks";

/**
 * Main Luau symbol scanner entry point.
 *
 * Combines all parser stages (core, cursor, bindings, functions, blocks)
 * into a single scanner that extracts symbols, function scopes, and
 * documentation from Luau source code.
 */
export class LuauSymbolScanner extends LuauSymbolScannerBlocks {}
