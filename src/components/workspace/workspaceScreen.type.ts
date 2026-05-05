import type {
    RobloxAccountIdentity,
    RobloxProcessInfo,
} from "../../lib/accounts/accounts.type";
import type { UseWorkspaceExecutorResult } from "../../lib/workspace/executor/executor.type";

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

export type ConfirmAction = "kill" | `kill-pid-${number}`;
