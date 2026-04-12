import { invoke } from "@tauri-apps/api/core";
import { scanLuauFileAnalysis as scanLuauFileAnalysisFallback } from "../luau/symbolScanner";
import type {
    LuauFileAnalysis,
    LuauScanMode,
} from "../luau/symbolScanner.type";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { isTauriEnvironment } from "./runtime";

class LuauAnalysisCommandError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "LuauAnalysisCommandError";
    }
}

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
