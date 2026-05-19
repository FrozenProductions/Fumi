export type WorkspaceLifecycleRuntime = {
    bootstrapWorkspacePromise: Promise<void> | null;
    hasBootstrappedWorkspaceSession: boolean;
    latestWorkspaceRefreshRequestId: number;
};
