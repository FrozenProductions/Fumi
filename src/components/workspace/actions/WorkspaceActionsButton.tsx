import { ArrowDown01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import type {
    CSSProperties,
    ReactElement,
    MouseEvent as ReactMouseEvent,
} from "react";
import { useEffect } from "react";
import {
    WORKSPACE_MENU_INSET_REM,
    WORKSPACE_MENU_RADIUS_REM,
} from "../../../constants/workspace/workspace";
import { useAppStore } from "../../../hooks/app/useAppStore";
import { useWorkspaceActionsMenu } from "../../../hooks/workspace/useWorkspaceActionsMenu";
import { getAppHotkeyShortcutLabel } from "../../../lib/app/hotkeys/hotkeys";
import { isTauriEnvironment } from "../../../lib/platform/runtime";
import { AppIcon } from "../../app/common/AppIcon";
import { AppTooltip } from "../../app/tooltip/AppTooltip";
import type { WorkspaceActionsButtonProps } from "../workspaceScreen.type";
import { WorkspaceActionsDropdown } from "./WorkspaceActionsDropdown";

/** Floating action button for execute, Roblox controls, and workspace actions. */
export function WorkspaceActionsButton({
    executor,
    isLaunching,
    onLaunchRoblox,
    isKillingRoblox,
    killingRobloxProcessPid,
    onKillRoblox,
    isOutlinePanelVisible,
    onToggleOutlinePanel,
    robloxProcesses,
    liveRobloxAccount,
    onKillRobloxProcess,
    onOpenExecutionHistory,
}: WorkspaceActionsButtonProps): ReactElement {
    const theme = useAppStore((state) => state.theme);
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const isStreamerModeEnabled = useAppStore(
        (state) => state.isStreamerModeEnabled,
    );
    const toggleOutlinePanelShortcutLabel = getAppHotkeyShortcutLabel(
        "TOGGLE_OUTLINE_PANEL",
        hotkeyBindings,
    );
    const isDark = theme === "dark";
    const { isAttached, isBusy, hasSupportedExecutor } = executor.state;
    const { executeActiveTab } = executor.actions;

    const isDesktopShell = isTauriEnvironment();
    const isAnyRobloxKillPending =
        isKillingRoblox || killingRobloxProcessPid !== null;
    const canLaunch = isDesktopShell && !isLaunching;
    const canExecute = hasSupportedExecutor && isAttached && !isBusy;
    const canKill = isDesktopShell && !isAnyRobloxKillPending;
    const canOpenMenu = isDesktopShell;

    const launchRobloxShortcutLabel = getAppHotkeyShortcutLabel(
        "LAUNCH_ROBLOX",
        hotkeyBindings,
    );
    const killRobloxShortcutLabel = getAppHotkeyShortcutLabel(
        "KILL_ROBLOX",
        hotkeyBindings,
    );
    const workspaceActionsMenu = useWorkspaceActionsMenu({
        isAnyRobloxKillPending,
    });
    const { containerRef } = workspaceActionsMenu.refs;
    const { confirmingAction, isDropdownOpen, isLaunchModifierActive } =
        workspaceActionsMenu.state;
    const { revealedProcessPid } = workspaceActionsMenu.state;
    const {
        clearPendingConfirm,
        closeMenu,
        handleHideProcess,
        handleProcessRowBlur,
        revealProcess,
        setLaunchModifierActive,
        startConfirm,
        toggleMenu,
    } = workspaceActionsMenu.actions;

    useEffect(() => {
        if (!isDropdownOpen) {
            return;
        }

        if (!canOpenMenu) {
            closeMenu();
        }
    }, [canOpenMenu, closeMenu, isDropdownOpen]);

    function handleLaunchClick(
        event: ReactMouseEvent<HTMLButtonElement>,
    ): void {
        if (!canLaunch) {
            return;
        }
        clearPendingConfirm();
        setLaunchModifierActive(event.shiftKey);
        if (!event.shiftKey) {
            closeMenu();
        }
        void onLaunchRoblox();
    }

    function handleExecuteClick(): void {
        if (!canExecute) {
            return;
        }
        clearPendingConfirm();
        closeMenu();
        void executeActiveTab();
    }

    function handleKillClick(): void {
        if (!canKill) {
            return;
        }
        if (confirmingAction === "kill") {
            clearPendingConfirm();
            closeMenu();
            void onKillRoblox();
        } else {
            startConfirm("kill");
        }
    }

    function handleKillProcessClick(pid: number): void {
        if (!canKill) {
            return;
        }

        const confirmKey = `kill-pid-${pid}` as const;
        if (confirmingAction === confirmKey) {
            clearPendingConfirm();
            closeMenu();
            void onKillRobloxProcess(pid);
        } else {
            startConfirm(confirmKey);
        }
    }

    function handleToggleOutlinePanelClick(): void {
        clearPendingConfirm();
        closeMenu();
        onToggleOutlinePanel();
    }

    function handleOpenExecutionHistoryClick(): void {
        clearPendingConfirm();
        closeMenu();
        onOpenExecutionHistory();
    }

    const containerClass = isDark
        ? "flex h-9 items-center rounded-[0.5rem] border border-fumi-300 bg-fumi-700 text-xs font-semibold tracking-wide text-fumi-50 shadow-sm transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:border-fumi-400"
        : "flex h-9 items-center rounded-[0.5rem] border border-fumi-200 bg-fumi-600 text-xs font-semibold tracking-wide text-white shadow-sm transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:border-fumi-700";

    const leftButtonClass = isDark
        ? "pointer-events-auto inline-flex h-full items-center gap-1.5 rounded-l-[0.5rem] pl-3.5 pr-2.5 transition-colors hover:bg-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
        : "pointer-events-auto inline-flex h-full items-center gap-1.5 rounded-l-[0.5rem] pl-3.5 pr-2.5 transition-colors hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50";

    const rightButtonClass = isDark
        ? "pointer-events-auto inline-flex h-full items-center justify-center rounded-r-[0.5rem] px-2 transition-colors hover:bg-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
        : "pointer-events-auto inline-flex h-full items-center justify-center rounded-r-[0.5rem] px-2 transition-colors hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50";

    const separatorClass = isDark
        ? "h-5 w-px bg-fumi-500"
        : "h-5 w-px bg-fumi-500/50";

    const dropdownStyle: CSSProperties & Record<string, string> = {
        "--workspace-actions-menu-radius": `${WORKSPACE_MENU_RADIUS_REM}rem`,
        "--workspace-actions-menu-inset": `${WORKSPACE_MENU_INSET_REM}rem`,
    };

    function getExecuteTooltip(): string {
        if (!hasSupportedExecutor) {
            return "No supported executor detected";
        }
        if (!isAttached) {
            return "Attach to an executor port before executing";
        }
        if (isBusy) {
            return "Executing…";
        }
        return "Execute the current tab through the executor";
    }

    function getMenuTooltip(): string {
        if (!isDesktopShell) {
            return "Roblox controls require the Tauri desktop shell";
        }

        return "More actions";
    }

    return (
        <div className="relative inline-flex items-center" ref={containerRef}>
            <div className={`app-select-none ${containerClass}`}>
                <AppTooltip content={getExecuteTooltip()} side="top">
                    <button
                        type="button"
                        onClick={handleExecuteClick}
                        disabled={!canExecute}
                        className={`${leftButtonClass} ${!canExecute ? "cursor-not-allowed opacity-60 hover:bg-transparent" : ""}`}
                        aria-label="Execute"
                    >
                        <AppIcon
                            icon={PlayIcon}
                            className="size-3.5 shrink-0"
                            strokeWidth={2.5}
                        />
                        <span className="translate-y-[0.5px]">
                            {isBusy ? "Executing…" : "Execute"}
                        </span>
                    </button>
                </AppTooltip>

                <div className={separatorClass} />

                <AppTooltip content={getMenuTooltip()} side="top">
                    <button
                        type="button"
                        onClick={() => {
                            if (!canOpenMenu) {
                                return;
                            }

                            toggleMenu();
                        }}
                        disabled={!canOpenMenu}
                        className={`${rightButtonClass} ${!canOpenMenu ? "cursor-not-allowed opacity-60 hover:bg-transparent" : ""}`}
                        aria-haspopup="menu"
                        aria-expanded={isDropdownOpen}
                        aria-label="Workspace actions menu"
                    >
                        <AppIcon
                            icon={ArrowDown01Icon}
                            className={`size-3.5 shrink-0 text-fumi-50 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                            strokeWidth={2.5}
                        />
                    </button>
                </AppTooltip>
            </div>

            {isDropdownOpen ? (
                <WorkspaceActionsDropdown
                    menu={{
                        dropdownStyle,
                        isDark,
                        isOutlinePanelVisible,
                        isLaunchModifierActive,
                        toggleOutlinePanelShortcutLabel,
                        launchRobloxShortcutLabel,
                        killRobloxShortcutLabel,
                    }}
                    roblox={{
                        processes: robloxProcesses,
                        liveAccount: liveRobloxAccount,
                        isDesktopShell,
                        isLaunching,
                        isKillingRoblox,
                        killingRobloxProcessPid,
                        canLaunch,
                        canKill,
                        isStreamerModeEnabled,
                        revealedProcessPid,
                    }}
                    confirm={{
                        confirmingAction,
                    }}
                    actions={{
                        onLaunch: handleLaunchClick,
                        onKillAll: handleKillClick,
                        onKillProcess: handleKillProcessClick,
                        onOpenExecutionHistory: handleOpenExecutionHistoryClick,
                        onProcessRowBlur: handleProcessRowBlur,
                        onRevealProcess: revealProcess,
                        onHideProcess: handleHideProcess,
                        onToggleOutlinePanel: handleToggleOutlinePanelClick,
                    }}
                />
            ) : null}
        </div>
    );
}
