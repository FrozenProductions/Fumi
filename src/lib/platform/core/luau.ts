import { invoke } from "@tauri-apps/api/core";
import type {
    FormatLuauScriptOptions,
    FormatLuauScriptResult,
} from "../../luau/luau.type";
import { scanLuauFileAnalysis as scanLuauFileAnalysisFallback } from "../../luau/symbolScanner/symbolScanner";
import type {
    LuauFileAnalysis,
    LuauScanMode,
} from "../../luau/symbolScanner/symbolScanner.type";
import { getUnknownCauseMessage } from "../../shared/errorMessage";
import { isTauriEnvironment } from "./runtime";

class LuauAnalysisCommandError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "LuauAnalysisCommandError";
    }
}

class LuauFormatCommandError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "LuauFormatCommandError";
    }
}

/**
 * Performs static analysis on a Luau script for symbols and syntax info.
 *
 * Falls back to local analysis when not in Tauri environment.
 *
 * Invokes the `scan_luau_file_analysis` Tauri command.
 *
 * @param options - Analysis options
 * @param options.content - The Luau source content
 * @param options.mode - Optional scan mode
 * @returns The file analysis result with symbols
 * @throws {LuauAnalysisCommandError} If the Tauri command fails
 */
export async function scanLuauFileAnalysis(options: {
    content: string;
    mode?: LuauScanMode;
}): Promise<LuauFileAnalysis> {
    const { content, mode } = options;

    if (!isTauriEnvironment()) {
        return Promise.resolve(
            scanLuauFileAnalysisFallback(content, {
                mode,
            }),
        );
    }

    try {
        return await invoke<LuauFileAnalysis>("scan_luau_file_analysis", {
            content,
            mode,
        });
    } catch (error) {
        throw new LuauAnalysisCommandError(
            getUnknownCauseMessage(error, "Could not analyze the Luau file."),
        );
    }
}

/**
 * Formats valid Luau source through the native backend beautifier.
 *
 * @param options - Format command options
 * @param options.content - Luau source content
 * @param options.formatOptions - Optional formatter settings
 * @returns Formatted Luau source
 * @throws {LuauFormatCommandError} If the Tauri command fails
 */
export async function formatLuauScript(options: {
    content: string;
    formatOptions?: FormatLuauScriptOptions;
}): Promise<FormatLuauScriptResult> {
    const { content, formatOptions } = options;

    if (!isTauriEnvironment()) {
        return Promise.resolve({ formatted: content });
    }

    try {
        return await invoke<FormatLuauScriptResult>("format_luau_script", {
            content,
            options: formatOptions,
        });
    } catch (error) {
        throw new LuauFormatCommandError(
            getUnknownCauseMessage(error, "Could not beautify the Luau file."),
        );
    }
}
