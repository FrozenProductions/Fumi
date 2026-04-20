import { useEffect, useRef } from "react";
import { WORKSPACE_PERSIST_DELAY_MS } from "../../constants/workspace/workspace";
import {
    getLastPersistedWorkspaceSignature,
    markWorkspacePersistedSignature,
} from "../../lib/workspace/persistence";
import {
    selectWorkspacePath,
    selectWorkspacePersistSignature,
} from "./store/selectors";
import { useWorkspaceStore } from "./useWorkspaceStore";

export function useWorkspaceStoreLifecycle(): void {
    const bootstrapWorkspaceSession = useWorkspaceStore(
        (state) => state.bootstrapWorkspaceSession,
    );
    const persistWorkspaceState = useWorkspaceStore(
        (state) => state.persistWorkspaceState,
    );
    const refreshWorkspaceFromFilesystem = useWorkspaceStore(
        (state) => state.refreshWorkspaceFromFilesystem,
    );
    const workspacePath = useWorkspaceStore(selectWorkspacePath);
    const workspaceSignature = useWorkspaceStore(
        selectWorkspacePersistSignature,
    );
    const refreshTimeoutRef = useRef<number | null>(null);
    const lastWorkspaceRefreshAtRef = useRef(0);

    useEffect(() => {
        void bootstrapWorkspaceSession();
    }, [bootstrapWorkspaceSession]);

    useEffect(() => {
        if (
            !workspaceSignature ||
            workspaceSignature === getLastPersistedWorkspaceSignature()
        ) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const latestWorkspaceSignature = selectWorkspacePersistSignature(
                useWorkspaceStore.getState(),
            );

            if (
                !latestWorkspaceSignature ||
                latestWorkspaceSignature ===
                    getLastPersistedWorkspaceSignature()
            ) {
                return;
            }

            void persistWorkspaceState().then((didPersist) => {
                if (didPersist) {
                    markWorkspacePersistedSignature(latestWorkspaceSignature);
                }
            });
        }, WORKSPACE_PERSIST_DELAY_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [persistWorkspaceState, workspaceSignature]);

    useEffect(() => {
        if (!workspacePath) {
            return;
        }

        const scheduleWorkspaceRefresh = (): void => {
            if (refreshTimeoutRef.current !== null) {
                window.clearTimeout(refreshTimeoutRef.current);
            }

            refreshTimeoutRef.current = window.setTimeout(() => {
                refreshTimeoutRef.current = null;

                const now = Date.now();

                // Focus and visibility events often arrive back-to-back.
                if (now - lastWorkspaceRefreshAtRef.current < 250) {
                    return;
                }

                lastWorkspaceRefreshAtRef.current = now;
                void refreshWorkspaceFromFilesystem();
            }, 100);
        };

        const handleWindowFocus = (): void => {
            scheduleWorkspaceRefresh();
        };

        const handleVisibilityChange = (): void => {
            if (document.visibilityState === "visible") {
                scheduleWorkspaceRefresh();
            }
        };

        window.addEventListener("focus", handleWindowFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            if (refreshTimeoutRef.current !== null) {
                window.clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }

            window.removeEventListener("focus", handleWindowFocus);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [refreshWorkspaceFromFilesystem, workspacePath]);
}
