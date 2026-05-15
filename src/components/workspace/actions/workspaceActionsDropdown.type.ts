import type {
    CSSProperties,
    FocusEvent,
    MouseEvent as ReactMouseEvent,
} from "react";
import type { WorkspaceActionsConfirmAction } from "../../../hooks/workspace/useWorkspaceActionsMenu";
import type {
    RobloxAccountIdentity,
    RobloxProcessInfo,
} from "../../../lib/accounts/accounts.type";

type WorkspaceActionsDropdownMenuProps = {
    dropdownStyle: CSSProperties & Record<string, string>;
    isDark: boolean;
    isOutlinePanelVisible: boolean;
    isLaunchModifierActive: boolean;
    toggleOutlinePanelShortcutLabel: string | null;
    launchRobloxShortcutLabel: string | null;
    killRobloxShortcutLabel: string | null;
};

type WorkspaceActionsDropdownRobloxProps = {
    processes: readonly RobloxProcessInfo[];
    liveAccount: RobloxAccountIdentity | null;
    isDesktopShell: boolean;
    isLaunching: boolean;
    isKillingRoblox: boolean;
    killingRobloxProcessPid: number | null;
    canLaunch: boolean;
    canKill: boolean;
    isStreamerModeEnabled: boolean;
    revealedProcessPid: number | null;
};

type WorkspaceActionsDropdownConfirmProps = {
    confirmingAction: WorkspaceActionsConfirmAction | null;
};

type WorkspaceActionsDropdownActionProps = {
    onLaunch: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    onKillAll: () => void;
    onKillProcess: (pid: number) => void;
    onOpenExecutionHistory: () => void;
    onProcessRowBlur: (event: FocusEvent<HTMLDivElement>, pid: number) => void;
    onRevealProcess: (pid: number) => void;
    onHideProcess: (
        pid: number,
        currentTarget: HTMLDivElement,
        relatedTarget?: EventTarget | null,
    ) => void;
    onToggleOutlinePanel: () => void;
};

export type WorkspaceActionsDropdownProps = {
    menu: WorkspaceActionsDropdownMenuProps;
    roblox: WorkspaceActionsDropdownRobloxProps;
    confirm: WorkspaceActionsDropdownConfirmProps;
    actions: WorkspaceActionsDropdownActionProps;
};
