import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/executor/useWorkspaceExecutor.type";
import type { UseWorkspaceTabRenameResult } from "../../hooks/workspace/tabBar/useWorkspaceTabRename.type";
import type {
    RobloxAccountIdentity,
    RobloxProcessInfo,
} from "../../lib/accounts/accounts.type";
import type { AppMiddleClickTabAction } from "../../lib/app/app.type";
import type {
    WorkspacePaneId,
    WorkspaceScreenSession,
    WorkspaceSplitView,
} from "../../lib/workspace/workspace.type";

export type WorkspaceScreenProps = {
    executor: UseWorkspaceExecutorResult;
    executionHistoryModal: {
        isOpen: boolean;
        onOpen: () => void;
        onClose: () => void;
    };
};

export type WorkspaceActionsButtonProps = {
    executor: UseWorkspaceExecutorResult;
    isLaunching: boolean;
    onLaunchRoblox: () => Promise<void>;
    isKillingRoblox: boolean;
    killingRobloxProcessPid: number | null;
    onKillRoblox: () => Promise<void>;
    isOutlinePanelVisible: boolean;
    onToggleOutlinePanel: () => void;
    robloxProcesses: readonly RobloxProcessInfo[];
    liveRobloxAccount: RobloxAccountIdentity | null;
    onKillRobloxProcess: (pid: number) => Promise<void>;
    onOpenExecutionHistory: () => void;
};

export type WorkspaceTabBarProps = {
    workspace: WorkspaceScreenSession;
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

export type ConfirmAction = "kill" | `kill-pid-${number}`;
