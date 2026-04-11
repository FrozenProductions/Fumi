import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/useWorkspaceExecutor.type";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type { UseWorkspaceTabRenameResult } from "../../hooks/workspace/useWorkspaceTabRename.type";
import type { RobloxProcessInfo } from "../../lib/accounts/accounts.type";
import type { AppMiddleClickTabAction } from "../../lib/app/app.type";
import type {
    WorkspacePaneId,
    WorkspaceSession,
    WorkspaceSplitView,
} from "../../lib/workspace/workspace.type";

export type WorkspaceScreenProps = {
    session: UseWorkspaceSessionResult;
    executor: UseWorkspaceExecutorResult;
};

export type WorkspaceActionsButtonProps = {
    executor: UseWorkspaceExecutorResult;
    isLaunching: boolean;
    onLaunchRoblox: () => Promise<void>;
    isKillingRoblox: boolean;
    onKillRoblox: () => Promise<void>;
    robloxProcesses: readonly RobloxProcessInfo[];
    onKillRobloxProcess: (pid: number) => Promise<void>;
};

export type WorkspaceTabBarProps = {
    workspace: WorkspaceSession;
    splitView: WorkspaceSplitView | null;
    renameState: UseWorkspaceTabRenameResult;
    onCreateFile: () => void;
    onSelectTab: (tabId: string) => void;
    onDuplicateTab: (tabId: string) => void;
    onArchiveTab: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    onOpenTabInPane: (tabId: string, pane: WorkspacePaneId) => void;
    onCloseSplitView: () => void;
    splitDropTarget: WorkspacePaneId | null;
    middleClickTabAction: AppMiddleClickTabAction;
};
