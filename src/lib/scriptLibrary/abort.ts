import type { AbortSignalSource } from "./abort.type";

/**
 * Combines multiple abort signals into a single aggregated signal.
 *
 * If any source signal aborts, the combined signal aborts immediately.
 * The returned cleanup function removes all listeners and should be called when done.
 *
 * @param signals - Abort signals to combine (nullish values are ignored)
 * @returns An object with the combined signal and a cleanup function
 */
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
