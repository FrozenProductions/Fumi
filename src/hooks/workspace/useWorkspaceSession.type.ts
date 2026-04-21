import type { WorkspaceTab } from "../../lib/workspace/workspace.type";
import type { WorkspaceStore } from "./store/workspaceStore.type";

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
    | "openWorkspaceTabInPane"
    | "setWorkspaceSplitRatio"
    | "resetWorkspaceSplitView"
    | "toggleWorkspaceSplitView"
    | "focusWorkspacePane"
    | "closeWorkspaceSplitView"
    | "updateActiveTabContent"
    | "updateActiveTabCursor"
    | "updateActiveTabScrollTop"
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
    | "openWorkspaceTabInPane"
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
    | "updateActiveTabCursor"
    | "updateActiveTabScrollTop"
    | "clearErrorMessage"
>;

export type UseWorkspaceSessionResult = {
    state: WorkspaceSessionState;
    workspaceActions: WorkspaceSessionWorkspaceActions;
    tabActions: WorkspaceSessionTabActions;
    archiveActions: WorkspaceSessionArchiveActions;
    editorActions: WorkspaceSessionEditorActions;
};
