import { getErrorMessage } from "../../../lib/shared/errorMessage";
import { getWorkspaceDirtyTabCount } from "../../../lib/workspace/session";
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
    const updateWorkspaceForPathWithPersistence = (
        workspacePath: string,
        updater: WorkspaceStoreUpdater,
        shouldMarkPersisted: boolean,
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
            if (nextWorkspace === currentWorkspace) {
                return {};
            }

            const nextPersistRevision = state.persistRevision + 1;

            return {
                workspace: nextWorkspace,
                dirtyTabCount: getWorkspaceDirtyTabCount(nextWorkspace),
                errorMessage: null,
                persistRevision: nextPersistRevision,
                lastPersistedRevision: shouldMarkPersisted
                    ? nextPersistRevision
                    : state.lastPersistedRevision,
            };
        });

        return nextWorkspace;
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
        persistWorkspaceAndRefresh,
        setWorkspaceError,
        updateWorkspaceForPath: (
            workspacePath: string,
            updater: WorkspaceStoreUpdater,
        ) =>
            updateWorkspaceForPathWithPersistence(
                workspacePath,
                updater,
                false,
            ),
        updatePersistedWorkspaceForPath: (
            workspacePath: string,
            updater: WorkspaceStoreUpdater,
        ) =>
            updateWorkspaceForPathWithPersistence(workspacePath, updater, true),
    };
}
