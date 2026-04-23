import {
    Cancel01Icon,
    FileCodeIcon,
    Logout01Icon,
    RocketIcon,
} from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { SCRIPT_LIBRARY_SPINNER_MASK_STYLE } from "../../../constants/scriptLibrary/screen";
import { AppIcon } from "../../app/common/AppIcon";
import { AppTooltip } from "../../app/tooltip/AppTooltip";
import { getLiveRobloxAccountTooltipLabel } from "./robloxProcessLabel";
import { WorkspaceActionsProcessList } from "./WorkspaceActionsProcessList";
import type { WorkspaceActionsDropdownProps } from "./workspaceActionsDropdown.type";

function getLaunchTooltip(options: WorkspaceActionsDropdownProps): string {
    const { menu, roblox } = options;

    if (!roblox.isDesktopShell) {
        return "Roblox controls require the Tauri desktop shell";
    }
    if (roblox.isLaunching) {
        return "Launching Roblox…";
    }
    if (menu.isLaunchModifierActive) {
        return "Launch Roblox and keep this menu open";
    }

    const liveRobloxAccountLabel = getLiveRobloxAccountTooltipLabel(
        roblox.liveAccount,
    );
    if (liveRobloxAccountLabel) {
        return `Launch Roblox as ${liveRobloxAccountLabel}`;
    }

    return "Launch Roblox instance";
}

function getKillTooltip(options: WorkspaceActionsDropdownProps): string {
    const { roblox } = options;

    if (!roblox.isDesktopShell) {
        return "Roblox controls require the Tauri desktop shell";
    }
    if (roblox.isKillingRoblox) {
        return "Killing Roblox processes…";
    }
    if (roblox.killingRobloxProcessPid !== null) {
        return "Killing Roblox instance…";
    }

    return "Attempt to close all Roblox instances";
}

/**
 * Dropdown content for Roblox and workspace actions.
 *
 * @param options - Component props grouped into menu, roblox, confirm, and actions
 */
export function WorkspaceActionsDropdown(
    options: WorkspaceActionsDropdownProps,
): ReactElement {
    const { actions, confirm, menu, roblox } = options;
    const hasProcesses = roblox.processes.length > 0;
    const killIsConfirming = confirm.confirmingAction === "kill";

    return (
        <div
            role="menu"
            style={menu.dropdownStyle}
            className={`pointer-events-auto absolute bottom-[calc(100%+0.5rem)] right-0 z-50 origin-bottom-right overflow-hidden rounded-[var(--workspace-actions-menu-radius)] border bg-fumi-50 p-1.5 shadow-[var(--shadow-app-floating)] animate-fade-in ${
                hasProcesses ? "w-52" : "w-44"
            } ${menu.isDark ? "border-fumi-200 bg-fumi-100" : "border-fumi-200 bg-fumi-50"}`}
        >
            <div
                className={`app-select-none mb-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    menu.isDark ? "text-fumi-500" : "text-fumi-400"
                }`}
            >
                More Actions
            </div>
            <div className="flex flex-col gap-0.5">
                <AppTooltip
                    content={
                        menu.isOutlinePanelVisible
                            ? "Hide the outline panel"
                            : "Show the outline panel"
                    }
                    shortcut={menu.toggleOutlinePanelShortcutLabel}
                    side="left"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={actions.onToggleOutlinePanel}
                        className={`app-select-none flex w-full items-center gap-2 rounded-[calc(var(--workspace-actions-menu-radius)-var(--workspace-actions-menu-inset))] px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                            menu.isDark
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
                            {menu.isOutlinePanelVisible
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
                        onClick={actions.onOpenExecutionHistory}
                        className={`app-select-none flex w-full items-center gap-2 rounded-[calc(var(--workspace-actions-menu-radius)-var(--workspace-actions-menu-inset))] px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                            menu.isDark
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
                    content={getLaunchTooltip(options)}
                    shortcut={menu.launchRobloxShortcutLabel}
                    side="left"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={actions.onLaunch}
                        disabled={!roblox.canLaunch}
                        className={`app-select-none flex w-full items-center gap-2 rounded-[calc(var(--workspace-actions-menu-radius)-var(--workspace-actions-menu-inset))] px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                            !roblox.canLaunch
                                ? "cursor-not-allowed opacity-60"
                                : menu.isLaunchModifierActive
                                  ? menu.isDark
                                      ? "outline outline-1 outline-dashed -outline-offset-1 outline-fumi-400 text-fumi-900 hover:bg-fumi-200"
                                      : "outline outline-1 outline-dashed -outline-offset-1 outline-fumi-300 text-fumi-700 hover:bg-fumi-100"
                                  : menu.isDark
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
                            {roblox.isLaunching
                                ? "Launching…"
                                : "Launch Roblox"}
                        </span>
                    </button>
                </AppTooltip>

                <AppTooltip
                    content={getKillTooltip(options)}
                    shortcut={menu.killRobloxShortcutLabel}
                    side="left"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={actions.onKillAll}
                        disabled={!roblox.canKill}
                        className={`app-select-none flex w-full items-center gap-2 rounded-[calc(var(--workspace-actions-menu-radius)-var(--workspace-actions-menu-inset))] px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                            !roblox.canKill
                                ? "cursor-not-allowed opacity-60"
                                : killIsConfirming
                                  ? menu.isDark
                                      ? "bg-red-950/70 text-red-100 hover:bg-red-900/80"
                                      : "bg-red-50 text-red-700 hover:bg-red-100"
                                  : menu.isDark
                                    ? "text-fumi-900 hover:bg-fumi-200"
                                    : "text-fumi-700 hover:bg-fumi-100"
                        }`}
                    >
                        {roblox.isKillingRoblox ? (
                            <div
                                className="size-3.5 shrink-0 animate-spin bg-current"
                                style={SCRIPT_LIBRARY_SPINNER_MASK_STYLE}
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
                            {roblox.isKillingRoblox
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
                        className={`mx-1 my-1.5 h-px ${
                            menu.isDark ? "bg-fumi-700" : "bg-fumi-150"
                        }`}
                    />
                    <div
                        className={`app-select-none mb-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            menu.isDark ? "text-fumi-500" : "text-fumi-400"
                        }`}
                    >
                        Instances
                    </div>
                    <div className="flex flex-col gap-0.5 px-0.5">
                        <WorkspaceActionsProcessList options={options} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
