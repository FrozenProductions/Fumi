import { useEffect } from "react";
import type { ExecutorKind } from "../../lib/workspace/workspace.type";
import { useAutomaticExecutionStore } from "./useAutomaticExecutionStore";

/**
 * Bootstraps automatic execution state and refreshes scripts on window focus.
 *
 * @remarks
 * Calls `bootstrapAutomaticExecution` on mount and refreshes from the filesystem
 * whenever the window regains focus or visibility. Skips refresh when the executor
 * kind is `"unsupported"` or no resolved path exists.
 *
 * @param executorKind - The current executor kind determining which runtime to bootstrap
 * @returns void (side-effect only)
 */
export function useAutomaticExecutionLifecycle(
    executorKind: ExecutorKind,
): void {
    const bootstrapAutomaticExecution = useAutomaticExecutionStore(
        (state) => state.bootstrapAutomaticExecution,
    );
    const refreshAutomaticExecution = useAutomaticExecutionStore(
        (state) => state.refreshAutomaticExecution,
    );
    const resolvedPath = useAutomaticExecutionStore(
        (state) => state.resolvedPath,
    );

    useEffect(() => {
        let isCancelled = false;

        void (async () => {
            if (!isCancelled) {
                await bootstrapAutomaticExecution(executorKind);
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [bootstrapAutomaticExecution, executorKind]);

    useEffect(() => {
        if (!resolvedPath || executorKind === "unsupported") {
            return;
        }

        const refreshFromFilesystem = (): void => {
            void refreshAutomaticExecution(executorKind);
        };

        const handleWindowFocus = (): void => {
            refreshFromFilesystem();
        };

        const handleVisibilityChange = (): void => {
            if (document.visibilityState === "visible") {
                refreshFromFilesystem();
            }
        };

        window.addEventListener("focus", handleWindowFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", handleWindowFocus);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [executorKind, refreshAutomaticExecution, resolvedPath]);
}
