import type {
    LuauAnalysisWorkerRequest,
    LuauAnalysisWorkerResponse,
} from "../lib/luau/analysis/workerAnalysis.type";
import { scanLuauFileAnalysis } from "../lib/luau/symbolScanner/symbolScanner";

const workerScope = globalThis as typeof globalThis & {
    addEventListener: (
        type: "message",
        listener: (event: MessageEvent<LuauAnalysisWorkerRequest>) => void,
    ) => void;
    postMessage: (message: LuauAnalysisWorkerResponse) => void;
};

workerScope.addEventListener("message", (event) => {
    const request = event.data;

    if (request.type !== "scan") {
        return;
    }

    try {
        const analysis = scanLuauFileAnalysis(request.content, {
            mode: request.mode,
        });

        workerScope.postMessage({
            id: request.id,
            type: "result",
            analysis,
        });
    } catch (error) {
        workerScope.postMessage({
            id: request.id,
            type: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Luau worker analysis failed.",
        });
    }
});
