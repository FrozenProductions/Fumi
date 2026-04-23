import type { FocusEvent, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type WorkspaceActionsConfirmAction = "kill" | `kill-pid-${number}`;

type UseWorkspaceActionsMenuOptions = {
    isAnyRobloxKillPending: boolean;
};

type UseWorkspaceActionsMenuResult = {
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

/**
 * Manages menu-local state for workspace actions including confirm timers and hover reveals.
 *
 * @param options - Hook options
 * @param options.isAnyRobloxKillPending - Whether any Roblox kill operation is in progress
 * @returns Menu refs, state, and action functions
 */
export function useWorkspaceActionsMenu({
    isAnyRobloxKillPending,
}: UseWorkspaceActionsMenuOptions): UseWorkspaceActionsMenuResult {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLaunchModifierActive, setIsLaunchModifierActive] = useState(false);
    const [revealedProcessPid, setRevealedProcessPid] = useState<number | null>(
        null,
    );
    const [confirmingAction, setConfirmingAction] =
        useState<WorkspaceActionsConfirmAction | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const confirmTimeoutRef = useRef<ReturnType<
        typeof window.setTimeout
    > | null>(null);

    const clearPendingConfirm = useCallback((): void => {
        if (confirmTimeoutRef.current !== null) {
            window.clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = null;
        }

        setConfirmingAction(null);
    }, []);

    const resetMenuState = useCallback((): void => {
        setIsLaunchModifierActive(false);
        setRevealedProcessPid(null);
    }, []);

    const closeMenu = useCallback((): void => {
        setIsDropdownOpen(false);
        resetMenuState();
    }, [resetMenuState]);

    const startConfirm = useCallback(
        (action: WorkspaceActionsConfirmAction): void => {
            clearPendingConfirm();
            setConfirmingAction(action);
            confirmTimeoutRef.current = window.setTimeout(() => {
                setConfirmingAction(null);
                confirmTimeoutRef.current = null;
            }, 2_000);
        },
        [clearPendingConfirm],
    );

    const toggleMenu = useCallback((): void => {
        setIsDropdownOpen((isOpen) => {
            const nextIsOpen = !isOpen;

            if (!nextIsOpen) {
                resetMenuState();
            }

            return nextIsOpen;
        });
    }, [resetMenuState]);

    const handleHideProcess = useCallback(
        (
            pid: number,
            currentTarget: HTMLDivElement,
            relatedTarget: EventTarget | null = null,
        ): void => {
            if (
                relatedTarget instanceof Node &&
                currentTarget.contains(relatedTarget)
            ) {
                return;
            }

            if (currentTarget.contains(document.activeElement)) {
                return;
            }

            if (currentTarget.matches(":hover")) {
                return;
            }

            setRevealedProcessPid((currentPid) =>
                currentPid === pid ? null : currentPid,
            );
        },
        [],
    );

    const handleProcessRowBlur = useCallback(
        (event: FocusEvent<HTMLDivElement>, pid: number): void => {
            handleHideProcess(pid, event.currentTarget, event.relatedTarget);
        },
        [handleHideProcess],
    );

    const revealProcess = useCallback((pid: number): void => {
        setRevealedProcessPid(pid);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent): void {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                closeMenu();
                clearPendingConfirm();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [clearPendingConfirm, closeMenu]);

    useEffect(() => {
        return () => {
            if (confirmTimeoutRef.current !== null) {
                window.clearTimeout(confirmTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isDropdownOpen) {
            setIsLaunchModifierActive(false);
            return;
        }

        function syncLaunchModifierState(event: KeyboardEvent): void {
            setIsLaunchModifierActive(event.shiftKey);
        }

        function resetLaunchModifierState(): void {
            setIsLaunchModifierActive(false);
        }

        window.addEventListener("keydown", syncLaunchModifierState);
        window.addEventListener("keyup", syncLaunchModifierState);
        window.addEventListener("blur", resetLaunchModifierState);

        return () => {
            window.removeEventListener("keydown", syncLaunchModifierState);
            window.removeEventListener("keyup", syncLaunchModifierState);
            window.removeEventListener("blur", resetLaunchModifierState);
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        if (!isAnyRobloxKillPending || confirmingAction === null) {
            return;
        }

        clearPendingConfirm();
    }, [clearPendingConfirm, confirmingAction, isAnyRobloxKillPending]);

    return {
        refs: {
            containerRef,
        },
        state: {
            isDropdownOpen,
            isLaunchModifierActive,
            revealedProcessPid,
            confirmingAction,
        },
        actions: {
            clearPendingConfirm,
            closeMenu,
            handleHideProcess,
            handleProcessRowBlur,
            revealProcess,
            setLaunchModifierActive: setIsLaunchModifierActive,
            startConfirm,
            toggleMenu,
        },
    };
}
