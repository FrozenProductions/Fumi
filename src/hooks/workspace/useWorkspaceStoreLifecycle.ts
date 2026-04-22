import { useEffect } from "react";
import { WORKSPACE_PERSIST_DELAY_MS } from "../../constants/workspace/workspace";
import {
    selectWorkspacePath,
    selectWorkspacePersistRevision,
} from "../../lib/workspace/store/selectors";
import { useWindowResume } from "../shared/useWindowResume";
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
    const pendingPersistRevision = useWorkspaceStore(
        selectWorkspacePersistRevision,
    );

    useEffect(() => {
        void bootstrapWorkspaceSession();
    }, [bootstrapWorkspaceSession]);

    useEffect(() => {
        if (pendingPersistRevision === null) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const latestPendingPersistRevision = selectWorkspacePersistRevision(
                useWorkspaceStore.getState(),
            );

            if (latestPendingPersistRevision === null) {
                return;
            }

            void persistWorkspaceState();
        }, WORKSPACE_PERSIST_DELAY_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [pendingPersistRevision, persistWorkspaceState]);

    useWindowResume(
        () => {
            void refreshWorkspaceFromFilesystem();
        },
        {
            isEnabled: workspacePath !== null,
        },
    );
}
