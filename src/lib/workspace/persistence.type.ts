import type { WorkspaceExecutionHistoryEntry } from "./executionHistory/executionHistory.type";
import type { WorkspaceSplitView } from "./session/sessionSplitView.type";
import type {
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "./session/tabs/sessionTabs.type";

export type WorkspaceMetadata = {
    version: 2 | 3 | 4 | 5;
    activeTabId: string | null;
    splitView: WorkspaceSplitView | null;
    tabs: WorkspaceTabState[];
    archivedTabs: WorkspaceTabState[];
    executionHistory: WorkspaceExecutionHistoryEntry[];
};

export type WorkspaceSnapshot = {
    workspacePath: string;
    workspaceName: string;
    metadata: WorkspaceMetadata;
    tabs: WorkspaceTabSnapshot[];
};

export type WorkspaceBootstrapResponse = {
    lastWorkspacePath: string | null;
    workspace: WorkspaceSnapshot | null;
};
