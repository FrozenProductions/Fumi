import { useEffect } from "react";
import { WORKSPACE_REFRESH_INTERVAL_MS } from "../../constants/workspace/workspace";
import {
    completeExitPreparation,
    resolveExitGuardSync,
    subscribeToExitGuardSyncRequested,
    subscribeToPrepareForExit,
} from "../../lib/platform/window";
import {
    getLastPersistedWorkspaceSignature,
    markWorkspacePersistedSignature,
} from "../../lib/workspace/persistence";
import {
    selectWorkspacePath,
    selectWorkspacePersistSignature,
    selectWorkspaceShouldGuardExit,
    useWorkspaceStore,
} from "./useWorkspaceStore";

const WORKSPACE_PERSIST_DELAY_MS = 200;

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

        const intervalId = window.setInterval(() => {
            void refreshWorkspaceFromFilesystem();
        }, WORKSPACE_REFRESH_INTERVAL_MS);

        const handleWindowFocus = (): void => {
            void refreshWorkspaceFromFilesystem();
        };

        const handleVisibilityChange = (): void => {
            if (document.visibilityState === "visible") {
                void refreshWorkspaceFromFilesystem();
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
    }, [refreshWorkspaceFromFilesystem, workspacePath]);

    useEffect(() => {
        return subscribeToPrepareForExit(() => {
            void (async () => {
                try {
                    const didPersist = await persistWorkspaceState();

                    if (didPersist) {
                        markWorkspacePersistedSignature(
                            selectWorkspacePersistSignature(
                                useWorkspaceStore.getState(),
                            ),
                        );
                    }
                } finally {
                    await completeExitPreparation();
                }
            })();
        });
    }, [persistWorkspaceState]);

    useEffect(() => {
        return subscribeToExitGuardSyncRequested((syncId) => {
            void resolveExitGuardSync(
                syncId,
                selectWorkspaceShouldGuardExit(useWorkspaceStore.getState()),
            );
        });
    }, []);
}
