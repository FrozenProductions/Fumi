import { useEffect } from "react";
import { AUTOMATIC_EXECUTION_REFRESH_INTERVAL_MS } from "../../constants/automaticExecution/automaticExecution";
import type { ExecutorKind } from "../../lib/workspace/workspace.type";
import { useAutomaticExecutionStore } from "./useAutomaticExecutionStore";

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

        const intervalId = window.setInterval(
            refreshFromFilesystem,
            AUTOMATIC_EXECUTION_REFRESH_INTERVAL_MS,
        );

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
            window.clearInterval(intervalId);
            window.removeEventListener("focus", handleWindowFocus);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [executorKind, refreshAutomaticExecution, resolvedPath]);
}
