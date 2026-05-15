import type { FocusEvent, RefObject } from "react";

export type WorkspaceActionsConfirmAction = "kill" | `kill-pid-${number}`;

export type UseWorkspaceActionsMenuOptions = {
    isAnyRobloxKillPending: boolean;
};

export type UseWorkspaceActionsMenuResult = {
    refs: {
        containerRef: RefObject<HTMLDivElement | null>;
    };
    state: {
        isDropdownOpen: boolean;
        isLaunchModifierActive: boolean;
        revealedProcessPid: number | null;
        confirmingAction: WorkspaceActionsConfirmAction | null;
    };
    actions: {
        clearPendingConfirm: () => void;
        closeMenu: () => void;
        handleHideProcess: (
            pid: number,
            currentTarget: HTMLDivElement,
            relatedTarget?: EventTarget | null,
        ) => void;
        handleProcessRowBlur: (
            event: FocusEvent<HTMLDivElement>,
            pid: number,
        ) => void;
        revealProcess: (pid: number) => void;
        setLaunchModifierActive: (value: boolean) => void;
        startConfirm: (action: WorkspaceActionsConfirmAction) => void;
        toggleMenu: () => void;
    };
};

export type WorkspaceActionsMenuState = {
    isDropdownOpen: boolean;
    isLaunchModifierActive: boolean;
    revealedProcessPid: number | null;
    confirmingAction: WorkspaceActionsConfirmAction | null;
};

export type WorkspaceActionsMenuStateUpdate =
    | Partial<WorkspaceActionsMenuState>
    | ((
          currentState: WorkspaceActionsMenuState,
      ) => Partial<WorkspaceActionsMenuState>);
