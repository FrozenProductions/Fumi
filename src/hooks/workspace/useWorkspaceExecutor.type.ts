import type {
    ExecutorKind,
    ExecutorPortSummary,
} from "../../lib/workspace/workspace.type";

export type AsyncUnsubscribe = () => void;

export type UseWorkspaceExecutorOptions = {
    activeTabContent: string | null;
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
};

export type WorkspaceExecutorActions = {
    updatePort: (value: string) => void;
    clearErrorMessage: () => void;
    toggleConnection: () => Promise<void>;
    executeActiveTab: () => Promise<void>;
};

export type UseWorkspaceExecutorResult = {
    state: WorkspaceExecutorState;
    actions: WorkspaceExecutorActions;
};
