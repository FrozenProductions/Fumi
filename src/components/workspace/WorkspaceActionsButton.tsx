import {
    ArrowDown01Icon,
    Cancel01Icon,
    FileCodeIcon,
    Logout01Icon,
    PlayIcon,
    RocketIcon,
} from "@hugeicons/core-free-icons";
import {
    type CSSProperties,
    type FocusEvent,
    type ReactElement,
    type MouseEvent as ReactMouseEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { SCRIPT_LIBRARY_SPINNER_MASK_STYLE } from "../../constants/scriptLibrary/screen";
import {
    WORKSPACE_MENU_INSET_REM,
    WORKSPACE_MENU_RADIUS_REM,
} from "../../constants/workspace/workspace";
import { useAppStore } from "../../hooks/app/useAppStore";
import { getAppHotkeyShortcutLabel } from "../../lib/app/hotkeys";
import { isTauriEnvironment } from "../../lib/platform/runtime";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import {
    getLiveRobloxAccountTooltipLabel,
    getRobloxProcessAccountLabel,
} from "./robloxProcessLabel";
import type {
    ConfirmAction,
    WorkspaceActionsButtonProps,
} from "./workspaceScreen.type";

/**
 * Floating action button for execute, Roblox controls, and workspace actions.
 *
 * @param props - Component props
 * @param props.executor - Executor state and actions
 * @param props.isLaunching - Whether Roblox is launching
 * @param props.onLaunchRoblox - Launch Roblox handler
 * @param props.isKillingRoblox - Whether Roblox is being killed
 * @param props.killingRobloxProcessPid - PID for the Roblox instance being killed
 * @param props.onKillRoblox - Kill all Roblox handler
 * @returns A React component
 */
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

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [revealedProcessPid, setRevealedProcessPid] = useState<number | null>(
        null,
    );
    const [confirmingAction, setConfirmingAction] =
        useState<ConfirmAction | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const confirmTimeoutRef = useRef<ReturnType<
        typeof window.setTimeout
    > | null>(null);

    const { isAttached, isBusy, hasSupportedExecutor } = executor.state;
    const { executeActiveTab } = executor.actions;

    const isDesktopShell = isTauriEnvironment();
    const isAnyRobloxKillPending =
        isKillingRoblox || killingRobloxProcessPid !== null;
    const canLaunch = isDesktopShell && !isLaunching;
    const canExecute = hasSupportedExecutor && isAttached && !isBusy;
    const canKill = isDesktopShell && !isAnyRobloxKillPending;
    const canOpenMenu = isDesktopShell;

    const hasProcesses = robloxProcesses.length > 0;
    const launchRobloxShortcutLabel = getAppHotkeyShortcutLabel(
        "LAUNCH_ROBLOX",
        hotkeyBindings,
    );
    const killRobloxShortcutLabel = getAppHotkeyShortcutLabel(
        "KILL_ROBLOX",
        hotkeyBindings,
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent): void {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
                setRevealedProcessPid(null);
                if (confirmTimeoutRef.current !== null) {
                    window.clearTimeout(confirmTimeoutRef.current);
                    confirmTimeoutRef.current = null;
                }
                setConfirmingAction(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (confirmTimeoutRef.current !== null) {
                window.clearTimeout(confirmTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isAnyRobloxKillPending || confirmingAction === null) {
            return;
        }

        if (confirmTimeoutRef.current !== null) {
            window.clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = null;
        }

        setConfirmingAction(null);
    }, [confirmingAction, isAnyRobloxKillPending]);

    function clearPendingConfirm(): void {
        if (confirmTimeoutRef.current !== null) {
            window.clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = null;
        }
        setConfirmingAction(null);
    }

    function startConfirm(action: ConfirmAction): void {
        clearPendingConfirm();
        setConfirmingAction(action);
        confirmTimeoutRef.current = window.setTimeout(() => {
            setConfirmingAction(null);
            confirmTimeoutRef.current = null;
        }, 2_000);
    }

    function handleLaunchClick(
        event: ReactMouseEvent<HTMLButtonElement>,
    ): void {
        if (!canLaunch) {
            return;
        }
        clearPendingConfirm();
        setRevealedProcessPid(null);
        if (!event.shiftKey) {
            setIsDropdownOpen(false);
        }
        void onLaunchRoblox();
    }

    function handleExecuteClick(): void {
        if (!canExecute) {
            return;
        }
        clearPendingConfirm();
        setIsDropdownOpen(false);
        setRevealedProcessPid(null);
        void executeActiveTab();
    }

    function handleKillClick(): void {
        if (!canKill) {
            return;
        }
        if (confirmingAction === "kill") {
            clearPendingConfirm();
            setRevealedProcessPid(null);
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
            setRevealedProcessPid(null);
            void onKillRobloxProcess(pid);
        } else {
            startConfirm(confirmKey);
        }
    }

    function handleToggleOutlinePanelClick(): void {
        clearPendingConfirm();
        setIsDropdownOpen(false);
        setRevealedProcessPid(null);
        onToggleOutlinePanel();
    }

    function handleOpenExecutionHistoryClick(): void {
        clearPendingConfirm();
        setIsDropdownOpen(false);
        setRevealedProcessPid(null);
        onOpenExecutionHistory();
    }

    function handleRevealProcess(pid: number): void {
        setRevealedProcessPid(pid);
    }

    function handleHideProcess(
        pid: number,
        currentTarget: HTMLDivElement,
        relatedTarget: EventTarget | null = null,
    ): void {
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
    }

    function handleProcessRowBlur(
        event: FocusEvent<HTMLDivElement>,
        pid: number,
    ): void {
        handleHideProcess(pid, event.currentTarget, event.relatedTarget);
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

    const killIsConfirming = confirmingAction === "kill";
    const dropdownStyle: CSSProperties & Record<string, string> = {
        "--workspace-actions-menu-radius": `${WORKSPACE_MENU_RADIUS_REM}rem`,
        "--workspace-actions-menu-inset": `${WORKSPACE_MENU_INSET_REM}rem`,
    };

    function getLaunchTooltip(): string {
        if (!isDesktopShell) {
            return "Roblox controls require the Tauri desktop shell";
        }
        if (isLaunching) {
            return "Launching Roblox…";
        }
        const liveRobloxAccountLabel =
            getLiveRobloxAccountTooltipLabel(liveRobloxAccount);
        if (liveRobloxAccountLabel) {
            return `Launch Roblox as ${liveRobloxAccountLabel}`;
        }
        return "Launch Roblox instance";
    }

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

    function getKillTooltip(): string {
        if (!isDesktopShell) {
            return "Roblox controls require the Tauri desktop shell";
        }
        if (isKillingRoblox) {
            return "Killing Roblox processes…";
        }
        if (killingRobloxProcessPid !== null) {
            return "Killing Roblox instance…";
        }
        return "Attempt to close all Roblox instances";
    }

    function renderProcessRows(): ReactElement[] {
        return robloxProcesses.map((process, index) => {
            const confirmKey = `kill-pid-${process.pid}` as const;
            const isKillingProcess = killingRobloxProcessPid === process.pid;
            const isConfirming =
                !isKillingProcess && confirmingAction === confirmKey;
            const canKillProcess = isDesktopShell && !isAnyRobloxKillPending;
            const isMasked =
                isStreamerModeEnabled && revealedProcessPid !== process.pid;
            const processAccountLabel = getRobloxProcessAccountLabel(process, {
                isMasked,
            });
            const maskedProcessAccountLabel = getRobloxProcessAccountLabel(
                process,
                {
                    isMasked: true,
                },
            );
            const shouldBlurProcessAccountLabel =
                isMasked && process.boundAccountDisplayName !== null;
            return (
                <div
                    key={process.pid}
                    className={`flex items-center justify-between rounded-[calc(var(--workspace-actions-menu-radius)-var(--workspace-actions-menu-inset))] pl-2.5 pr-1 py-1 transition-colors ${
                        isKillingProcess
                            ? isDark
                                ? "bg-fumi-200/80"
                                : "bg-fumi-100"
                            : isConfirming
                              ? isDark
                                  ? "bg-red-950/60"
                                  : "bg-red-50"
                              : isDark
                                ? "hover:bg-fumi-200/70"
                                : "hover:bg-fumi-100/60"
                    }`}
                >
                    <div
                        className={`min-w-0 text-[11px] font-medium ${
                            isKillingProcess
                                ? isDark
                                    ? "text-fumi-900"
                                    : "text-fumi-700"
                                : isConfirming
                                  ? isDark
                                      ? "text-red-200"
                                      : "text-red-700"
                                  : isDark
                                    ? "text-fumi-900"
                                    : "text-fumi-700"
                        }`}
                    >
                        {isKillingProcess ? (
                            "Killing…"
                        ) : isConfirming ? (
                            "Confirm kill?"
                        ) : (
                            <>
                                <div>{`Instance ${index + 1}`}</div>
                                <div
                                    tabIndex={
                                        isStreamerModeEnabled &&
                                        process.boundAccountDisplayName !== null
                                            ? 0
                                            : -1
                                    }
                                    onPointerEnter={() =>
                                        handleRevealProcess(process.pid)
                                    }
                                    onPointerLeave={(event) =>
                                        handleHideProcess(
                                            process.pid,
                                            event.currentTarget,
                                        )
                                    }
                                    onFocus={() =>
                                        handleRevealProcess(process.pid)
                                    }
                                    onBlur={(event) =>
                                        handleProcessRowBlur(event, process.pid)
                                    }
                                    className={`mt-0.5 truncate rounded-[0.4rem] text-[10px] transition-[filter] duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fumi-600 ${
                                        isDark
                                            ? "text-fumi-500"
                                            : "text-fumi-400"
                                    } ${
                                        shouldBlurProcessAccountLabel
                                            ? "blur-[0.20rem]"
                                            : "blur-0"
                                    }`}
                                >
                                    {processAccountLabel}
                                </div>
                            </>
                        )}
                    </div>
                    <AppTooltip
                        content={
                            !isDesktopShell
                                ? "Roblox controls require the Tauri desktop shell"
                                : isKillingProcess
                                  ? `Killing instance ${index + 1}…`
                                  : isConfirming
                                    ? "Click to confirm kill"
                                    : `Kill instance ${index + 1} (${isMasked ? maskedProcessAccountLabel : processAccountLabel})`
                        }
                        side="left"
                    >
                        <button
                            type="button"
                            onClick={() => handleKillProcessClick(process.pid)}
                            disabled={!canKillProcess}
                            className={`flex size-5 shrink-0 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fumi-600 ${
                                !canKillProcess
                                    ? "cursor-not-allowed opacity-60"
                                    : isKillingProcess
                                      ? isDark
                                          ? "text-fumi-500"
                                          : "text-fumi-400"
                                      : isConfirming
                                        ? isDark
                                            ? "text-red-300 hover:bg-red-900/60 hover:text-red-100"
                                            : "text-red-600 hover:bg-red-100 hover:text-red-800"
                                        : isDark
                                          ? "text-fumi-500 hover:bg-fumi-200 hover:text-fumi-900"
                                          : "text-fumi-400 hover:bg-fumi-200 hover:text-fumi-700"
                            }`}
                            aria-label={`Kill Roblox instance ${index + 1}`}
                        >
                            {isKillingProcess ? (
                                <div
                                    className="size-3 shrink-0 animate-spin bg-current"
                                    style={SCRIPT_LIBRARY_SPINNER_MASK_STYLE}
                                />
                            ) : (
                                <AppIcon
                                    icon={Cancel01Icon}
                                    className="size-3 shrink-0"
                                    strokeWidth={2.5}
                                />
                            )}
                        </button>
                    </AppTooltip>
                </div>
            );
        });
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

                            setIsDropdownOpen((open) => {
                                const nextIsOpen = !open;

                                if (!nextIsOpen) {
                                    setRevealedProcessPid(null);
                                }

                                return nextIsOpen;
                            });
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
                <div
                    role="menu"
                    style={dropdownStyle}
                    className={`pointer-events-auto absolute bottom-[calc(100%+0.5rem)] right-0 z-50 origin-bottom-right overflow-hidden rounded-[var(--workspace-actions-menu-radius)] border bg-fumi-50 p-1.5 shadow-[var(--shadow-app-floating)] animate-fade-in ${
                        hasProcesses ? "w-52" : "w-44"
                    } ${isDark ? "border-fumi-200 bg-fumi-100" : "border-fumi-200 bg-fumi-50"}`}
                >
                    <div
                        className={`app-select-none mb-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-fumi-500" : "text-fumi-400"}`}
                    >
                        More Actions
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <AppTooltip
                            content={
                                isOutlinePanelVisible
                                    ? "Hide the outline panel"
                                    : "Show the outline panel"
                            }
                            shortcut={toggleOutlinePanelShortcutLabel}
                            side="left"
                        >
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleToggleOutlinePanelClick}
                                className={`app-select-none flex w-full items-center gap-2 rounded-[calc(var(--workspace-actions-menu-radius)-var(--workspace-actions-menu-inset))] px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                    isDark
                                        ? "text-fumi-900 hover:bg-fumi-200"
                                        : "text-fumi-700 hover:bg-fumi-100"
                                }`}
                            >
                                <AppIcon
                                    icon={FileCodeIcon}
                                    className="size-3.5 shrink-0 -translate-y-[0.5px]"
                                    strokeWidth={2.5}
                                />
                                <span>
                                    {isOutlinePanelVisible
                                        ? "Hide outline panel"
                                        : "Show outline panel"}
                                </span>
                            </button>
                        </AppTooltip>

                        <AppTooltip
                            content="Inspect and replay successful manual executes"
                            side="left"
                        >
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleOpenExecutionHistoryClick}
                                className={`app-select-none flex w-full items-center gap-2 rounded-[calc(var(--workspace-actions-menu-radius)-var(--workspace-actions-menu-inset))] px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                    isDark
                                        ? "text-fumi-900 hover:bg-fumi-200"
                                        : "text-fumi-700 hover:bg-fumi-100"
                                }`}
                            >
                                <AppIcon
                                    icon={FileCodeIcon}
                                    className="size-3.5 shrink-0 -translate-y-[0.5px]"
                                    strokeWidth={2.5}
                                />
                                <span>Execution history</span>
                            </button>
                        </AppTooltip>

                        <AppTooltip
                            content={getLaunchTooltip()}
                            shortcut={launchRobloxShortcutLabel}
                            side="left"
                        >
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleLaunchClick}
                                disabled={!canLaunch}
                                className={`app-select-none flex w-full items-center gap-2 rounded-[calc(var(--workspace-actions-menu-radius)-var(--workspace-actions-menu-inset))] px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                    !canLaunch
                                        ? "cursor-not-allowed opacity-60"
                                        : isDark
                                          ? "text-fumi-900 hover:bg-fumi-200"
                                          : "text-fumi-700 hover:bg-fumi-100"
                                }`}
                            >
                                <AppIcon
                                    icon={RocketIcon}
                                    className="size-3.5 shrink-0 -translate-y-[0.5px]"
                                    strokeWidth={2.5}
                                />
                                <span>
                                    {isLaunching
                                        ? "Launching…"
                                        : "Launch Roblox"}
                                </span>
                            </button>
                        </AppTooltip>

                        <AppTooltip
                            content={getKillTooltip()}
                            shortcut={killRobloxShortcutLabel}
                            side="left"
                        >
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleKillClick}
                                disabled={!canKill}
                                className={`app-select-none flex w-full items-center gap-2 rounded-[calc(var(--workspace-actions-menu-radius)-var(--workspace-actions-menu-inset))] px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                    !canKill
                                        ? "cursor-not-allowed opacity-60"
                                        : killIsConfirming
                                          ? isDark
                                              ? "bg-red-950/70 text-red-100 hover:bg-red-900/80"
                                              : "bg-red-50 text-red-700 hover:bg-red-100"
                                          : isDark
                                            ? "text-fumi-900 hover:bg-fumi-200"
                                            : "text-fumi-700 hover:bg-fumi-100"
                                }`}
                            >
                                {isKillingRoblox ? (
                                    <div
                                        className="size-3.5 shrink-0 animate-spin bg-current"
                                        style={
                                            SCRIPT_LIBRARY_SPINNER_MASK_STYLE
                                        }
                                    />
                                ) : (
                                    <AppIcon
                                        icon={
                                            killIsConfirming
                                                ? Cancel01Icon
                                                : Logout01Icon
                                        }
                                        className="size-3.5 shrink-0 -translate-y-[0.5px]"
                                        strokeWidth={2.5}
                                    />
                                )}
                                <span>
                                    {isKillingRoblox
                                        ? "Killing…"
                                        : killIsConfirming
                                          ? "Confirm kill all"
                                          : "Kill Roblox"}
                                </span>
                            </button>
                        </AppTooltip>
                    </div>

                    {hasProcesses ? (
                        <div className="animate-fade-in">
                            <div
                                className={`mx-1 my-1.5 h-px ${isDark ? "bg-fumi-700" : "bg-fumi-150"}`}
                            />
                            <div
                                className={`app-select-none mb-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-fumi-500" : "text-fumi-400"}`}
                            >
                                Instances
                            </div>
                            <div className="flex flex-col gap-0.5 px-0.5">
                                {renderProcessRows()}
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
