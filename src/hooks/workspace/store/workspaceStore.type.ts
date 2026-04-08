import type { StateCreator } from "zustand";
import type {
    WorkspaceCursorState,
    WorkspaceSession,
} from "../../../lib/workspace/workspace.type";

export type WorkspaceStoreState = {
    workspace: WorkspaceSession | null;
    recentWorkspacePaths: string[];
    isBootstrapping: boolean;
    isHydrated: boolean;
    errorMessage: string | null;
};

export type WorkspaceStoreActions = {
    bootstrapWorkspaceSession: () => Promise<void>;
    persistWorkspaceState: () => Promise<boolean>;
    refreshWorkspaceFromFilesystem: () => Promise<void>;
    openWorkspaceDirectory: () => Promise<void>;
    openWorkspacePath: (workspacePath: string) => Promise<void>;
    createWorkspaceFile: () => Promise<void>;
    addWorkspaceScriptTab: (
        fileName: string,
        content: string,
    ) => Promise<boolean>;
    duplicateWorkspaceTab: (tabId: string) => Promise<void>;
    archiveWorkspaceTab: (tabId: string) => Promise<void>;
    deleteWorkspaceTab: (tabId: string) => Promise<void>;
    restoreArchivedWorkspaceTab: (tabId: string) => Promise<void>;
    restoreAllArchivedWorkspaceTabs: () => Promise<void>;
    deleteArchivedWorkspaceTab: (tabId: string) => Promise<void>;
    deleteAllArchivedWorkspaceTabs: () => Promise<void>;
    renameWorkspaceTab: (
        tabId: string,
        nextBaseName: string,
    ) => Promise<boolean>;
    selectWorkspaceTab: (tabId: string) => void;
    reorderWorkspaceTab: (draggedTabId: string, targetTabId: string) => void;
    saveActiveWorkspaceTab: () => Promise<void>;
    updateActiveTabContent: (content: string) => void;
    updateActiveTabCursor: (cursor: WorkspaceCursorState) => void;
    updateActiveTabScrollTop: (scrollTop: number) => void;
    setErrorMessage: (errorMessage: string | null) => void;
    clearErrorMessage: () => void;
};

export type WorkspaceStore = WorkspaceStoreState & WorkspaceStoreActions;

type WorkspaceStoreSet = Parameters<StateCreator<WorkspaceStore>>[0];
type WorkspaceStoreGet = Parameters<StateCreator<WorkspaceStore>>[1];
type WorkspaceStoreApi = Parameters<StateCreator<WorkspaceStore>>[2];

export type WorkspaceLifecycleSlice = Pick<
    WorkspaceStoreActions,
    | "bootstrapWorkspaceSession"
    | "persistWorkspaceState"
    | "refreshWorkspaceFromFilesystem"
    | "openWorkspaceDirectory"
    | "openWorkspacePath"
>;

export type WorkspaceTabSlice = Pick<
    WorkspaceStoreActions,
    | "createWorkspaceFile"
    | "addWorkspaceScriptTab"
    | "duplicateWorkspaceTab"
    | "archiveWorkspaceTab"
    | "deleteWorkspaceTab"
    | "restoreArchivedWorkspaceTab"
    | "restoreAllArchivedWorkspaceTabs"
    | "deleteArchivedWorkspaceTab"
    | "deleteAllArchivedWorkspaceTabs"
    | "renameWorkspaceTab"
    | "selectWorkspaceTab"
    | "reorderWorkspaceTab"
>;

export type WorkspaceEditorSlice = Pick<
    WorkspaceStoreActions,
    | "saveActiveWorkspaceTab"
    | "updateActiveTabContent"
    | "updateActiveTabCursor"
    | "updateActiveTabScrollTop"
    | "setErrorMessage"
    | "clearErrorMessage"
>;

export type WorkspaceStoreSliceCreator<TSlice> = (
    set: WorkspaceStoreSet,
    get: WorkspaceStoreGet,
    store: WorkspaceStoreApi,
) => TSlice;

export type WorkspaceStoreUpdater = (
    workspace: WorkspaceSession,
) => WorkspaceSession;
