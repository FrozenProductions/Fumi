import { scanLuauFileAnalysis } from "../symbolScanner/symbolScanner";
import type {
    LuauFileAnalysis,
    LuauScanMode,
} from "../symbolScanner/symbolScanner.type";
import type {
    LuauAnalysisWorkerRequest,
    LuauAnalysisWorkerResponse,
} from "./workerAnalysis.type";

type PendingAnalysisRequest = {
    reject: (reason?: unknown) => void;
    resolve: (value: LuauFileAnalysis) => void;
};

type QueuedAnalysisRequest = {
    id: number;
    request: LuauAnalysisWorkerRequest;
};

type LuauAnalysisWorkerState = {
    activeRequestId: number | null;
    pendingRequests: Map<number, PendingAnalysisRequest>;
    queuedRequest: QueuedAnalysisRequest | null;
    worker: Worker;
};

let nextLuauAnalysisRequestId = 0;
let luauAnalysisWorkerState: LuauAnalysisWorkerState | null = null;

function fallbackToLocalAnalysis(options: {
    content: string;
    mode?: LuauScanMode;
}): Promise<LuauFileAnalysis> {
    return Promise.resolve(
        scanLuauFileAnalysis(options.content, {
            mode: options.mode,
        }),
    );
}

function rejectPendingRequests(reason: unknown): void {
    if (!luauAnalysisWorkerState) {
        return;
    }

    for (const pendingRequest of luauAnalysisWorkerState.pendingRequests.values()) {
        pendingRequest.reject(reason);
    }

    luauAnalysisWorkerState.pendingRequests.clear();
}

function rejectPendingRequestById(requestId: number, reason: unknown): void {
    if (!luauAnalysisWorkerState) {
        return;
    }

    const pendingRequest =
        luauAnalysisWorkerState.pendingRequests.get(requestId);

    if (!pendingRequest) {
        return;
    }

    luauAnalysisWorkerState.pendingRequests.delete(requestId);
    pendingRequest.reject(reason);
}

function resetWorkerState(): void {
    luauAnalysisWorkerState?.worker.terminate();
    luauAnalysisWorkerState = null;
}

function canUseLuauAnalysisWorker(): boolean {
    return typeof window !== "undefined" && typeof Worker !== "undefined";
}

function dispatchQueuedRequest(): void {
    if (
        !luauAnalysisWorkerState ||
        luauAnalysisWorkerState.activeRequestId !== null ||
        luauAnalysisWorkerState.queuedRequest === null
    ) {
        return;
    }

    const queuedRequest = luauAnalysisWorkerState.queuedRequest;

    luauAnalysisWorkerState.queuedRequest = null;
    luauAnalysisWorkerState.activeRequestId = queuedRequest.id;
    luauAnalysisWorkerState.worker.postMessage(queuedRequest.request);
}

function getLuauAnalysisWorkerState(): LuauAnalysisWorkerState {
    if (luauAnalysisWorkerState) {
        return luauAnalysisWorkerState;
    }

    const worker = new Worker(
        new URL("../../../workers/luauAnalysis.worker.ts", import.meta.url),
        {
            type: "module",
        },
    );
    const pendingRequests = new Map<number, PendingAnalysisRequest>();

    worker.addEventListener(
        "message",
        (event: MessageEvent<LuauAnalysisWorkerResponse>) => {
            if (!luauAnalysisWorkerState) {
                return;
            }

            const response = event.data;
            const pendingRequest = luauAnalysisWorkerState.pendingRequests.get(
                response.id,
            );

            if (!pendingRequest) {
                return;
            }

            luauAnalysisWorkerState.activeRequestId = null;
            luauAnalysisWorkerState.pendingRequests.delete(response.id);
            dispatchQueuedRequest();

            if (response.type === "result") {
                pendingRequest.resolve(response.analysis);
                return;
            }

            pendingRequest.reject(new Error(response.message));
        },
    );

    worker.addEventListener("error", (event) => {
        rejectPendingRequests(
            event.error ??
                new Error("Luau analysis worker failed to initialize."),
        );
        resetWorkerState();
    });

    luauAnalysisWorkerState = {
        activeRequestId: null,
        pendingRequests,
        queuedRequest: null,
        worker,
    };

    return luauAnalysisWorkerState;
}

/**
 * Analyzes Luau file content in a background worker, falling back to synchronous analysis on failure.
 */
export function analyzeLuauFileInBackground(options: {
    content: string;
    mode?: LuauScanMode;
}): Promise<LuauFileAnalysis> {
    if (!canUseLuauAnalysisWorker()) {
        return fallbackToLocalAnalysis(options);
    }

    try {
        const workerState = getLuauAnalysisWorkerState();
        const requestId = nextLuauAnalysisRequestId + 1;

        nextLuauAnalysisRequestId = requestId;

        return new Promise<LuauFileAnalysis>((resolve, reject) => {
            workerState.pendingRequests.set(requestId, {
                resolve,
                reject,
            });

            const request: LuauAnalysisWorkerRequest = {
                id: requestId,
                type: "scan",
                content: options.content,
                mode: options.mode,
            };

            if (workerState.activeRequestId === null) {
                workerState.activeRequestId = requestId;
                workerState.worker.postMessage(request);
                return;
            }

            const queuedRequestId = workerState.queuedRequest?.id ?? null;

            if (queuedRequestId !== null) {
                rejectPendingRequestById(
                    queuedRequestId,
                    new Error("Superseded by a newer Luau analysis request."),
                );
            }

            workerState.queuedRequest = {
                id: requestId,
                request,
            };
        }).catch((error) => {
            if (
                error instanceof Error &&
                error.message === "Superseded by a newer Luau analysis request."
            ) {
                throw error;
            }

            resetWorkerState();
            return fallbackToLocalAnalysis(options).catch(() => {
                throw error;
            });
        });
    } catch {
        resetWorkerState();
        return fallbackToLocalAnalysis(options);
    }
}
