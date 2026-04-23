import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { SCRIPT_LIBRARY_SPINNER_MASK_STYLE } from "../../../constants/scriptLibrary/screen";
import { AppIcon } from "../../app/common/AppIcon";
import { AppTooltip } from "../../app/tooltip/AppTooltip";
import { getRobloxProcessAccountLabel } from "./robloxProcessLabel";
import type { WorkspaceActionsDropdownProps } from "./workspaceActionsDropdown.type";

type WorkspaceActionsProcessListProps = {
    options: WorkspaceActionsDropdownProps;
};

/**
 * Renders per-instance Roblox actions inside the workspace actions dropdown.
 *
 * @param props - Component props
 * @param props.options - The shared dropdown props containing menu, roblox, confirm, and actions state
 */
export function WorkspaceActionsProcessList({
    options,
}: WorkspaceActionsProcessListProps): ReactElement[] {
    const { actions, confirm, menu, roblox } = options;

    return roblox.processes.map((process, index) => {
        const confirmKey = `kill-pid-${process.pid}` as const;
        const isKillingProcess = roblox.killingRobloxProcessPid === process.pid;
        const isConfirming =
            !isKillingProcess && confirm.confirmingAction === confirmKey;
        const isMasked =
            roblox.isStreamerModeEnabled &&
            roblox.revealedProcessPid !== process.pid;
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
                        ? menu.isDark
                            ? "bg-fumi-200/80"
                            : "bg-fumi-100"
                        : isConfirming
                          ? menu.isDark
                              ? "bg-red-950/60"
                              : "bg-red-50"
                          : menu.isDark
                            ? "hover:bg-fumi-200/70"
                            : "hover:bg-fumi-100/60"
                }`}
            >
                <div
                    className={`min-w-0 text-[11px] font-medium ${
                        isKillingProcess
                            ? menu.isDark
                                ? "text-fumi-900"
                                : "text-fumi-700"
                            : isConfirming
                              ? menu.isDark
                                  ? "text-red-200"
                                  : "text-red-700"
                              : menu.isDark
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
                                    roblox.isStreamerModeEnabled &&
                                    process.boundAccountDisplayName !== null
                                        ? 0
                                        : -1
                                }
                                onPointerEnter={() =>
                                    actions.onRevealProcess(process.pid)
                                }
                                onPointerLeave={(event) =>
                                    actions.onHideProcess(
                                        process.pid,
                                        event.currentTarget,
                                    )
                                }
                                onFocus={() =>
                                    actions.onRevealProcess(process.pid)
                                }
                                onBlur={(event) =>
                                    actions.onProcessRowBlur(event, process.pid)
                                }
                                className={`mt-0.5 truncate rounded-[0.4rem] text-[10px] transition-[filter] duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fumi-600 ${
                                    menu.isDark
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
                        !roblox.isDesktopShell
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
                        onClick={() => actions.onKillProcess(process.pid)}
                        disabled={!roblox.canKill}
                        className={`flex size-5 shrink-0 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fumi-600 ${
                            !roblox.canKill
                                ? "cursor-not-allowed opacity-60"
                                : isKillingProcess
                                  ? menu.isDark
                                      ? "text-fumi-500"
                                      : "text-fumi-400"
                                  : isConfirming
                                    ? menu.isDark
                                        ? "text-red-300 hover:bg-red-900/60 hover:text-red-100"
                                        : "text-red-600 hover:bg-red-100 hover:text-red-800"
                                    : menu.isDark
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
