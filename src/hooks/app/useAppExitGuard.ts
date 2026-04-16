import { useEffect } from "react";
import { setAutomaticExecutionUnsavedChanges } from "../../lib/platform/automaticExecution";
import {
    completeExitPreparation,
    resolveExitGuardSync,
    subscribeToExitGuardSyncRequested,
    subscribeToPrepareForExit,
} from "../../lib/platform/window";
import { setWorkspaceUnsavedChanges } from "../../lib/platform/workspace";
import {
    selectAutomaticExecutionHasUnsavedChanges,
    useAutomaticExecutionStore,
} from "../automaticExecution/useAutomaticExecutionStore";
import {
    selectWorkspaceHasUnsavedChanges,
    useWorkspaceStore,
} from "../workspace/useWorkspaceStore";

export function useAppExitGuard(): void {
    const workspaceHasUnsavedChanges = useWorkspaceStore(
        selectWorkspaceHasUnsavedChanges,
    );
    const persistWorkspaceState = useWorkspaceStore(
        (state) => state.persistWorkspaceState,
    );
    const automaticExecutionHasUnsavedChanges = useAutomaticExecutionStore(
        selectAutomaticExecutionHasUnsavedChanges,
    );
    const automaticExecutionExecutorKind = useAutomaticExecutionStore(
        (state) => state.executorKind,
    );
    const persistAutomaticExecutionState = useAutomaticExecutionStore(
        (state) => state.persistAutomaticExecutionState,
    );

    useEffect(() => {
        void setWorkspaceUnsavedChanges(workspaceHasUnsavedChanges).catch(
            (error) => {
                console.error(
                    "Failed to sync workspace unsaved changes.",
                    error,
                );
            },
        );
    }, [workspaceHasUnsavedChanges]);

    useEffect(() => {
        void setAutomaticExecutionUnsavedChanges(
            automaticExecutionHasUnsavedChanges,
        ).catch((error) => {
            console.error(
                "Failed to sync automatic execution unsaved changes.",
                error,
            );
        });
    }, [automaticExecutionHasUnsavedChanges]);

    useEffect(() => {
        return subscribeToExitGuardSyncRequested((syncId) => {
            void resolveExitGuardSync(
                syncId,
                selectWorkspaceHasUnsavedChanges(
                    useWorkspaceStore.getState(),
                ) ||
                    selectAutomaticExecutionHasUnsavedChanges(
                        useAutomaticExecutionStore.getState(),
                    ),
            );
        });
    }, []);

    useEffect(() => {
        return subscribeToPrepareForExit(() => {
            void (async () => {
                try {
                    await persistWorkspaceState();

                    if (automaticExecutionExecutorKind !== "unsupported") {
                        await persistAutomaticExecutionState(
                            automaticExecutionExecutorKind,
                        );
                    }
                } catch (error) {
                    console.error(
                        "Failed to persist state during exit preparation.",
                        error,
                    );
                } finally {
                    await completeExitPreparation();
                }
            })();
        });
    }, [
        automaticExecutionExecutorKind,
        persistAutomaticExecutionState,
        persistWorkspaceState,
    ]);
}
