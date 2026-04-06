export type UseWorkspaceExecutorOptions = {
    activeTabContent: string | null;
};

export type UseWorkspaceExecutorResult = {
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
