import type { AppSidebarPosition } from "../../../lib/app/sidebar.type";
import type {
    WorkspaceExecutorActions,
    WorkspaceExecutorState,
} from "../../../lib/workspace/executor/executor.type";

export type AppTopbarExecutorControlsProps = {
    state: Pick<
        WorkspaceExecutorState,
        | "availablePorts"
        | "availablePortSummaries"
        | "didRecentAttachFail"
        | "hasSupportedExecutor"
        | "isAttached"
        | "isBusy"
        | "port"
    >;
    actions: Pick<WorkspaceExecutorActions, "toggleConnection" | "updatePort">;
};

export type AppTopbarProps = {
    title: string;
    isSidebarOpen: boolean;
    sidebarPosition: AppSidebarPosition;
    onToggleSidebar: () => void;
    workspaceName?: string | null;
    workspacePath?: string | null;
    onOpenWorkspace?: () => void;
    executorControls?: AppTopbarExecutorControlsProps;
};
