import { useEffect } from "react";
import {
    WORKSPACE_PERSIST_DELAY_MS,
    WORKSPACE_REFRESH_INTERVAL_MS,
} from "../../constants/workspace/workspace";
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
}
