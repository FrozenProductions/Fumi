import type { StateCreator } from "zustand";
import type { WorkspaceExecutionHistoryEntry } from "../executionHistory/executionHistory.type";
import type { WorkspaceSession } from "../session/session.type";
import type { WorkspaceCursorState } from "../session/sessionCursor.type";
import type {
    WorkspaceLegacyPaneId,
    WorkspaceSplitDirection,
    WorkspaceSplitPlacement,
} from "../session/sessionSplitView.type";

export type WorkspaceBulkArchiveOptions = {
    scopeTabIds?: readonly string[];
};

export type WorkspaceStoreState = {
    workspace: WorkspaceSession | null;
    dirtyTabCount: number;
    transientTabCursorsById: Record<string, WorkspaceCursorState>;
    recentWorkspacePaths: string[];
    persistRevision: number;
    lastPersistedRevision: number;
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
    importDroppedWorkspaceFiles: (filePaths: string[]) => Promise<boolean>;
    duplicateWorkspaceTab: (tabId: string) => Promise<void>;
    archiveWorkspaceTab: (tabId: string) => Promise<void>;
    archiveAllWorkspaceTabs: (
        options?: WorkspaceBulkArchiveOptions,
    ) => Promise<void>;
    archiveOtherWorkspaceTabs: (
        tabId: string,
        options?: WorkspaceBulkArchiveOptions,
    ) => Promise<void>;
    deleteWorkspaceTab: (tabId: string) => Promise<void>;
    restoreArchivedWorkspaceTab: (tabId: string) => Promise<void>;
    restoreAllArchivedWorkspaceTabs: () => Promise<void>;
    deleteArchivedWorkspaceTab: (tabId: string) => Promise<void>;
    deleteAllArchivedWorkspaceTabs: () => Promise<void>;
    renameWorkspaceTab: (
        tabId: string,
        nextBaseName: string,
    ) => Promise<boolean>;
    toggleWorkspaceTabPinned: (tabId: string) => void;
    selectWorkspaceTab: (tabId: string) => void;
    reorderWorkspaceTab: (draggedTabId: string, targetTabId: string) => void;
    splitWorkspaceTab: (
        tabId: string,
        targetPaneId: string | null,
        placement: WorkspaceSplitPlacement,
    ) => void;
    openWorkspaceTabInPane: (
        tabId: string,
        pane: WorkspaceLegacyPaneId,
        direction?: WorkspaceSplitDirection,
    ) => void;
    moveWorkspaceTabToPane: (tabId: string, paneId: string) => void;
    setWorkspaceSplitDirection: (direction: WorkspaceSplitDirection) => void;
    setWorkspaceSplitRatio: (
        splitRatio: number,
        splitId?: string,
        dividerIndex?: number,
    ) => void;
    resetWorkspaceSplitView: () => void;
    toggleWorkspaceSplitView: () => void;
    focusWorkspacePane: (paneId: string) => void;
    closeWorkspaceSplitView: () => void;
    saveActiveWorkspaceTab: () => Promise<void>;
    updateActiveTabContent: (content: string) => void;
    updateActiveTabCursor: (cursor: WorkspaceCursorState) => void;
    updateActiveTabScrollTop: (scrollTop: number) => void;
    replaceWorkspaceExecutionHistory: (
        workspacePath: string,
        entries: WorkspaceExecutionHistoryEntry[],
    ) => void;
    setErrorMessage: (errorMessage: string | null) => void;
    clearErrorMessage: () => void;
};

export type WorkspaceStore = WorkspaceStoreState & WorkspaceStoreActions;

export type WorkspaceStoreSet = Parameters<StateCreator<WorkspaceStore>>[0];
export type WorkspaceStoreGet = Parameters<StateCreator<WorkspaceStore>>[1];
export type WorkspaceStoreApi = Parameters<StateCreator<WorkspaceStore>>[2];

export type WorkspaceLifecycleSlice = Pick<
    WorkspaceStoreActions,
    | "bootstrapWorkspaceSession"
    | "persistWorkspaceState"
    | "refreshWorkspaceFromFilesystem"
    | "openWorkspaceDirectory"
    | "openWorkspacePath"
    | "replaceWorkspaceExecutionHistory"
>;

export type WorkspaceFileSlice = Pick<
    WorkspaceStoreActions,
    | "createWorkspaceFile"
    | "addWorkspaceScriptTab"
    | "importDroppedWorkspaceFiles"
    | "duplicateWorkspaceTab"
    | "deleteWorkspaceTab"
    | "renameWorkspaceTab"
    | "toggleWorkspaceTabPinned"
>;

export type WorkspaceArchiveSlice = Pick<
    WorkspaceStoreActions,
    | "archiveWorkspaceTab"
    | "archiveAllWorkspaceTabs"
    | "archiveOtherWorkspaceTabs"
    | "restoreArchivedWorkspaceTab"
    | "restoreAllArchivedWorkspaceTabs"
    | "deleteArchivedWorkspaceTab"
    | "deleteAllArchivedWorkspaceTabs"
>;

export type WorkspaceLayoutSlice = Pick<
    WorkspaceStoreActions,
    | "selectWorkspaceTab"
    | "reorderWorkspaceTab"
    | "splitWorkspaceTab"
    | "openWorkspaceTabInPane"
    | "moveWorkspaceTabToPane"
    | "setWorkspaceSplitDirection"
    | "setWorkspaceSplitRatio"
    | "resetWorkspaceSplitView"
    | "toggleWorkspaceSplitView"
    | "focusWorkspacePane"
    | "closeWorkspaceSplitView"
>;

export type WorkspaceTabSlice = WorkspaceFileSlice &
    WorkspaceArchiveSlice &
    WorkspaceLayoutSlice;

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
