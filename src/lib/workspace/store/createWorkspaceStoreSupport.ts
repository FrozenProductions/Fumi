import { getErrorMessage } from "../../shared/errorMessage";
import { getWorkspaceDirtyTabCount } from "../session/session";
import type { WorkspaceCursorState, WorkspaceSession } from "../workspace.type";
import { isMatchingWorkspacePath } from "./workspaceNavigation";
import type {
    WorkspaceStoreGet,
    WorkspaceStoreSet,
    WorkspaceStoreUpdater,
} from "./workspaceStore.type";

import type { WorkspaceStoreSupport } from "./workspaceStoreSupport.type";

/**
 * Creates shared helper methods for the workspace store including update, persist, and error handling.
 */
export function createWorkspaceStoreSupport(
    set: WorkspaceStoreSet,
    get: WorkspaceStoreGet,
): WorkspaceStoreSupport {
    const pruneTransientTabCursors = (
        transientTabCursorsById: Record<string, WorkspaceCursorState>,
        nextWorkspace: WorkspaceSession,
    ): Record<string, WorkspaceCursorState> => {
        const openTabIds = new Set(nextWorkspace.tabs.map((tab) => tab.id));
        let hasPrunedEntry = false;
        const nextTransientTabCursorsById: Record<
            string,
            WorkspaceCursorState
        > = {};

        for (const [tabId, cursor] of Object.entries(transientTabCursorsById)) {
            if (!openTabIds.has(tabId)) {
                hasPrunedEntry = true;
                continue;
            }

            nextTransientTabCursorsById[tabId] = cursor;
        }

        return hasPrunedEntry
            ? nextTransientTabCursorsById
            : transientTabCursorsById;
    };

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
                transientTabCursorsById: pruneTransientTabCursors(
                    state.transientTabCursorsById,
                    nextWorkspace,
                ),
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
