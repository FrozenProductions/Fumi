export type AppTopbarWorkspaceContext = {
    workspaceName: string | null;
    workspacePath: string | null;
    onOpenWorkspace: (() => void) | undefined;
};
