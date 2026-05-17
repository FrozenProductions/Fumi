import type { WorkspaceExecutionHistoryEntry } from "../executionHistory/executionHistory.type";
import type { WorkspaceStore } from "../store/workspaceStore.type";
import type { WorkspaceSplitView } from "./sessionSplitView.type";
import type {
    WorkspaceScreenTab,
    WorkspaceTab,
    WorkspaceTabState,
} from "./tabs/sessionTabs.type";

export type WorkspaceSession = {
    workspacePath: string;
    workspaceName: string;
    activeTabId: string | null;
    splitView: WorkspaceSplitView | null;
    tabs: WorkspaceTab[];
    archivedTabs: WorkspaceTabState[];
    executionHistory: WorkspaceExecutionHistoryEntry[];
};

export type WorkspaceScreenSession = Omit<WorkspaceSession, "tabs"> & {
    tabs: WorkspaceScreenTab[];
};

type UseWorkspaceSessionStoreFields = Pick<
    WorkspaceStore,
    | "archiveWorkspaceTab"
    | "addWorkspaceScriptTab"
    | "createWorkspaceFile"
    | "importDroppedWorkspaceFiles"
    | "deleteAllArchivedWorkspaceTabs"
    | "deleteArchivedWorkspaceTab"
    | "deleteWorkspaceTab"
    | "clearErrorMessage"
    | "errorMessage"
    | "isBootstrapping"
    | "openWorkspaceDirectory"
    | "openWorkspacePath"
    | "recentWorkspacePaths"
    | "renameWorkspaceTab"
    | "reorderWorkspaceTab"
    | "restoreAllArchivedWorkspaceTabs"
    | "restoreArchivedWorkspaceTab"
    | "saveActiveWorkspaceTab"
    | "selectWorkspaceTab"
    | "toggleWorkspaceTabPinned"
    | "splitWorkspaceTab"
    | "openWorkspaceTabInPane"
    | "moveWorkspaceTabToPane"
    | "setWorkspaceSplitDirection"
    | "setWorkspaceSplitRatio"
    | "resetWorkspaceSplitView"
    | "toggleWorkspaceSplitView"
    | "focusWorkspacePane"
    | "closeWorkspaceSplitView"
    | "updateActiveTabContent"
    | "updateWorkspaceTabContent"
    | "updateActiveTabCursor"
    | "updateActiveTabScrollTop"
    | "setErrorMessage"
    | "workspace"
    | "duplicateWorkspaceTab"
>;

export type WorkspaceSessionState = Pick<
    UseWorkspaceSessionStoreFields,
    "errorMessage" | "isBootstrapping" | "recentWorkspacePaths" | "workspace"
> & {
    activeTab: WorkspaceTab | null;
    activeTabIndex: number;
    hasUnsavedChanges: boolean;
};

export type WorkspaceSessionWorkspaceActions = Pick<
    UseWorkspaceSessionStoreFields,
    | "addWorkspaceScriptTab"
    | "createWorkspaceFile"
    | "importDroppedWorkspaceFiles"
    | "openWorkspaceDirectory"
    | "openWorkspacePath"
>;

export type WorkspaceSessionTabActions = Pick<
    UseWorkspaceSessionStoreFields,
    | "archiveWorkspaceTab"
    | "deleteWorkspaceTab"
    | "duplicateWorkspaceTab"
    | "renameWorkspaceTab"
    | "reorderWorkspaceTab"
    | "saveActiveWorkspaceTab"
    | "selectWorkspaceTab"
    | "toggleWorkspaceTabPinned"
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

export type WorkspaceSessionArchiveActions = Pick<
    UseWorkspaceSessionStoreFields,
    | "deleteAllArchivedWorkspaceTabs"
    | "deleteArchivedWorkspaceTab"
    | "restoreAllArchivedWorkspaceTabs"
    | "restoreArchivedWorkspaceTab"
>;

export type WorkspaceSessionEditorActions = Pick<
    UseWorkspaceSessionStoreFields,
    | "updateActiveTabContent"
    | "updateWorkspaceTabContent"
    | "updateActiveTabCursor"
    | "updateActiveTabScrollTop"
    | "setErrorMessage"
    | "clearErrorMessage"
>;

export type UseWorkspaceSessionResult = {
    state: WorkspaceSessionState;
    workspaceActions: WorkspaceSessionWorkspaceActions;
    tabActions: WorkspaceSessionTabActions;
    archiveActions: WorkspaceSessionArchiveActions;
    editorActions: WorkspaceSessionEditorActions;
};
