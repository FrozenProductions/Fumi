import type { WorkspaceSession } from "../session/session.type";
import type { WorkspaceStoreUpdater } from "./workspaceStore.type";

export type WorkspaceStoreSupport = {
    persistWorkspaceAndRefresh: () => Promise<boolean>;
    setWorkspaceError: (
        error: unknown,
        logMessage: string,
        fallbackMessage: string,
    ) => void;
    updateWorkspaceForPath: (
        workspacePath: string,
        updater: WorkspaceStoreUpdater,
    ) => WorkspaceSession | null;
    updatePersistedWorkspaceForPath: (
        workspacePath: string,
        updater: WorkspaceStoreUpdater,
    ) => WorkspaceSession | null;
};
