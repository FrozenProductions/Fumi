import { getErrorMessage } from "../../../lib/shared/errorMessage";
import {
    getWorkspacePersistSignature,
    markWorkspacePersistedSignature,
} from "../../../lib/workspace/persistence";
import type { WorkspaceSession } from "../../../lib/workspace/workspace.type";
import { isMatchingWorkspacePath } from "./helpers";
import type {
    WorkspaceStoreGet,
    WorkspaceStoreSet,
    WorkspaceStoreUpdater,
} from "./workspaceStore.type";

import type { WorkspaceStoreSupport } from "./workspaceStoreSupport.type";

export function createWorkspaceStoreSupport(
    set: WorkspaceStoreSet,
    get: WorkspaceStoreGet,
): WorkspaceStoreSupport {
    const updateWorkspaceForPath = (
        workspacePath: string,
        updater: WorkspaceStoreUpdater,
    ): WorkspaceSession | null => {
        let nextWorkspace: WorkspaceSession | null = null;

        set((state) => {
            if (!isMatchingWorkspacePath(state.workspace, workspacePath)) {
                return {};
            }

            const currentWorkspace = state.workspace;

            if (!currentWorkspace) {
                return {};
            }

            nextWorkspace = updater(currentWorkspace);

            return {
                workspace: nextWorkspace,
                errorMessage: null,
            };
        });

        return nextWorkspace;
    };

    const markNextWorkspaceAsPersisted = (
        nextWorkspace: WorkspaceSession | null,
    ): void => {
        if (!nextWorkspace) {
            return;
        }

        markWorkspacePersistedSignature(
            getWorkspacePersistSignature(nextWorkspace),
        );
    };

    const persistWorkspaceAndRefresh = async (): Promise<boolean> => {
        const { persistWorkspaceState, refreshWorkspaceFromFilesystem } = get();
        const didPersist = await persistWorkspaceState();

        if (!didPersist) {
            return false;
        }

        await refreshWorkspaceFromFilesystem();
        set({ errorMessage: null });
        return true;
    };

    const setWorkspaceError = (
        error: unknown,
        logMessage: string,
        fallbackMessage: string,
    ): void => {
        console.error(logMessage, error);

        set({
            errorMessage: getErrorMessage(error, fallbackMessage),
        });
    };

    return {
        markNextWorkspaceAsPersisted,
        persistWorkspaceAndRefresh,
        setWorkspaceError,
        updateWorkspaceForPath,
    };
}
