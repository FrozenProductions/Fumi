import type { AbortSignalSource } from "./abort.type";

export function combineAbortSignals(...signals: AbortSignalSource[]): {
    signal: AbortSignal;
    cleanup: () => void;
} {
    const controller = new AbortController();
    const cleanupCallbacks: Array<() => void> = [];

    const abort = (): void => {
        if (!controller.signal.aborted) {
            controller.abort();
        }
    };

    for (const signal of signals) {
        if (!signal) {
            continue;
        }

        if (signal.aborted) {
            abort();
            continue;
        }

        const handleAbort = (): void => {
            abort();
        };

        signal.addEventListener("abort", handleAbort, { once: true });
        cleanupCallbacks.push(() => {
            signal.removeEventListener("abort", handleAbort);
        });
    }

    return {
        signal: controller.signal,
        cleanup: () => {
            for (const cleanup of cleanupCallbacks) {
                cleanup();
            }
        },
    };
}
