import type { ExecutorKind } from "../../lib/workspace/workspace.type";

export type UseWorkspaceExecutorOptions = {
    activeTabContent: string | null;
};

export type UseWorkspaceExecutorResult = {
    executorKind: ExecutorKind;
    availablePorts: readonly number[];
    hasSupportedExecutor: boolean;
    port: string;
    isAttached: boolean;
    didRecentAttachFail: boolean;
    isBusy: boolean;
    errorMessage: string | null;
    updatePort: (value: string) => void;
    clearErrorMessage: () => void;
    toggleConnection: () => Promise<void>;
    executeActiveTab: () => Promise<void>;
};
