import type {
    ExecutorConsoleMessage,
    ExecutorKind,
    ExecutorPortSummary,
    WorkspaceExecutionHistoryEntry,
} from "../../lib/workspace/workspace.type";

export type AsyncUnsubscribe = () => void;

export type UseWorkspaceExecutorOptions = {
    workspacePath: string | null;
    activeTab: {
        fileName: string;
        content: string;
    } | null;
    onExecutionHistoryUpdated?: (
        workspacePath: string,
        entries: WorkspaceExecutionHistoryEntry[],
    ) => void;
};

export type WorkspaceExecutorState = {
    executorKind: ExecutorKind;
    availablePorts: readonly number[];
    availablePortSummaries: readonly ExecutorPortSummary[];
    hasSupportedExecutor: boolean;
    port: string;
    isAttached: boolean;
    didRecentAttachFail: boolean;
    isBusy: boolean;
    errorMessage: string | null;
    recentMessages: readonly ExecutorConsoleMessage[];
};

export type WorkspaceExecutorActions = {
    updatePort: (value: string) => void;
    clearErrorMessage: () => void;
    toggleConnection: () => Promise<void>;
    executeActiveTab: () => Promise<void>;
    executeHistoryEntry: (
        entry: WorkspaceExecutionHistoryEntry,
    ) => Promise<void>;
    clearRecentMessages: () => void;
};

export type UseWorkspaceExecutorResult = {
    state: WorkspaceExecutorState;
    actions: WorkspaceExecutorActions;
};
