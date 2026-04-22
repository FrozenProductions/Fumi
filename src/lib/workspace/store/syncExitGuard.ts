import { setWorkspaceUnsavedChanges } from "../../../lib/platform/workspace";
import { selectWorkspaceShouldGuardExit } from "./selectors";
import type { WorkspaceStore } from "./workspaceStore.type";

export type WorkspaceExitGuardSync = (state: WorkspaceStore) => void;

export function createWorkspaceExitGuardSync(): WorkspaceExitGuardSync {
    let lastRequestedWorkspaceExitGuard: boolean | null = null;
    let latestWorkspaceExitGuardRequestId = 0;

    return (state: WorkspaceStore): void => {
        const shouldGuardExit = selectWorkspaceShouldGuardExit(state);

        if (shouldGuardExit === lastRequestedWorkspaceExitGuard) {
            return;
        }

        lastRequestedWorkspaceExitGuard = shouldGuardExit;
        const requestId = ++latestWorkspaceExitGuardRequestId;

        void setWorkspaceUnsavedChanges(shouldGuardExit)
            .then(() => {
                if (requestId !== latestWorkspaceExitGuardRequestId) {
                    return;
                }
            })
            .catch((error) => {
                if (requestId !== latestWorkspaceExitGuardRequestId) {
                    return;
                }

                lastRequestedWorkspaceExitGuard = null;
                console.error(
                    "Failed to sync the workspace exit guard.",
                    error,
                );
            });
    };
}
