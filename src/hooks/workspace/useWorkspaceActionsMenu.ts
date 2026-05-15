import type { FocusEvent } from "react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import type {
    UseWorkspaceActionsMenuOptions,
    UseWorkspaceActionsMenuResult,
    WorkspaceActionsConfirmAction,
    WorkspaceActionsMenuState,
    WorkspaceActionsMenuStateUpdate,
} from "./useWorkspaceActionsMenu.type";

function updateWorkspaceActionsMenuState(
    currentState: WorkspaceActionsMenuState,
    update: WorkspaceActionsMenuStateUpdate,
): WorkspaceActionsMenuState {
    const nextState =
        typeof update === "function" ? update(currentState) : update;

    return {
        ...currentState,
        ...nextState,
    };
}

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
    const [state, dispatchMenuState] = useReducer(
        updateWorkspaceActionsMenuState,
        {
            isDropdownOpen: false,
            isLaunchModifierActive: false,
            revealedProcessPid: null,
            confirmingAction: null,
        },
    );
    const {
        isDropdownOpen,
        isLaunchModifierActive,
        revealedProcessPid,
        confirmingAction,
    } = state;
    const containerRef = useRef<HTMLDivElement>(null);
    const confirmTimeoutRef = useRef<ReturnType<
        typeof window.setTimeout
    > | null>(null);

    const clearPendingConfirm = useCallback((): void => {
        if (confirmTimeoutRef.current !== null) {
            window.clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = null;
        }

        dispatchMenuState({ confirmingAction: null });
    }, []);

    const closeMenu = useCallback((): void => {
        dispatchMenuState({
            isDropdownOpen: false,
            isLaunchModifierActive: false,
            revealedProcessPid: null,
        });
    }, []);

    const startConfirm = useCallback(
        (action: WorkspaceActionsConfirmAction): void => {
            clearPendingConfirm();
            dispatchMenuState({ confirmingAction: action });
            confirmTimeoutRef.current = window.setTimeout(() => {
                dispatchMenuState({ confirmingAction: null });
                confirmTimeoutRef.current = null;
            }, 2_000);
        },
        [clearPendingConfirm],
    );

    const toggleMenu = useCallback((): void => {
        dispatchMenuState((currentState) => {
            const isDropdownOpen = !currentState.isDropdownOpen;

            return {
                isDropdownOpen,
                isLaunchModifierActive: isDropdownOpen
                    ? currentState.isLaunchModifierActive
                    : false,
                revealedProcessPid: isDropdownOpen
                    ? currentState.revealedProcessPid
                    : null,
            };
        });
    }, []);

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

            dispatchMenuState((currentState) => ({
                revealedProcessPid:
                    currentState.revealedProcessPid === pid
                        ? null
                        : currentState.revealedProcessPid,
            }));
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
        dispatchMenuState({ revealedProcessPid: pid });
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
            dispatchMenuState({ isLaunchModifierActive: false });
            return;
        }

        function syncLaunchModifierState(event: KeyboardEvent): void {
            dispatchMenuState({ isLaunchModifierActive: event.shiftKey });
        }

        function resetLaunchModifierState(): void {
            dispatchMenuState({ isLaunchModifierActive: false });
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
            setLaunchModifierActive: (value) => {
                dispatchMenuState({ isLaunchModifierActive: value });
            },
            startConfirm,
            toggleMenu,
        },
    };
}
