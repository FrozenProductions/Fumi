import type { UseWorkspaceTabRenameResult } from "../../hooks/workspace/tabBar/useWorkspaceTabRename.type";
import type {
    RobloxAccountIdentity,
    RobloxProcessInfo,
} from "../../lib/accounts/accounts.type";
import type { AppMiddleClickTabAction } from "../../lib/app/app.type";
import type { UseWorkspaceExecutorResult } from "../../lib/workspace/executor/executor.type";
import type { WorkspaceScreenSession } from "../../lib/workspace/session/session.type";
import type {
    WorkspaceSplitPlacement,
    WorkspaceSplitView,
} from "../../lib/workspace/session/sessionSplitView.type";
import type { WorkspaceMessageStateProps } from "./feedback/workspaceFeedback.type";

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

export type WorkspaceReadyContentProps = {
    activeTab: WorkspaceScreenSession["tabs"][number] | null;
    createFileAction: NonNullable<WorkspaceMessageStateProps["action"]>;
    isSplitViewArchiveScopeEnabled: boolean;
    isTabDragActive: boolean;
    middleClickTabAction: AppMiddleClickTabAction;
    renameState: UseWorkspaceTabRenameResult;
    resolvedSplitView: WorkspaceSplitView | null;
    workspace: WorkspaceScreenSession;
    workspaceActionsButton: WorkspaceActionsButtonProps;
    onArchiveAllWorkspaceTabs: (scopeTabIds?: readonly string[]) => void;
    onArchiveOtherWorkspaceTabs: (
        tabId: string,
        scopeTabIds?: readonly string[],
    ) => void;
    onArchiveWorkspaceTab: (tabId: string) => void;
    onCloseWorkspaceSplitView: () => void;
    onCreateWorkspaceFile: () => void;
    onDeleteWorkspaceTab: (tabId: string) => void;
    onDuplicateWorkspaceTab: (tabId: string) => void;
    onResizeSplitCancel: () => void;
    onResizeSplitCommit: (
        splitRatio: number,
        splitId: string,
        dividerIndex: number,
    ) => void;
    onResizeSplitPreview: (
        splitRatio: number,
        splitId: string,
        dividerIndex: number,
    ) => void;
    onSelectWorkspaceTab: (tabId: string) => void;
    onSplitWorkspaceTab: (
        tabId: string,
        targetPaneId: string | null,
        placement: WorkspaceSplitPlacement,
    ) => void;
    onToggleWorkspaceTabPinned: (tabId: string) => void;
};

export type WorkspaceActiveTabStatusProps = {
    activeTab: WorkspaceScreenSession["tabs"][number] | null;
    activeTabIndex: number;
    tabCount: number;
};

export type WorkspaceActionsMainButtonsProps = {
    canExecute: boolean;
    canOpenMenu: boolean;
    executeTooltip: string;
    menuTooltip: string;
    executeActiveTabShortcutLabel?: string;
    isBusy: boolean;
    isDropdownOpen: boolean;
    leftButtonClass: string;
    rightButtonClass: string;
    onExecute: () => void;
    onToggleMenu: () => void;
};
