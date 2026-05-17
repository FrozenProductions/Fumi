import type {
    WorkspaceActionsExecuteTooltipOptions,
    WorkspaceActionsMenuTooltipOptions,
} from "./workspaceActionsTooltip.type";

/**
 * Generates the tooltip text for the workspace execute action.
 *
 * @param options - Tooltip options, including execution state and attachment status
 * @returns A tooltip string describing the current execution state
 */
export function getWorkspaceActionsExecuteTooltip({
    hasSupportedExecutor,
    isAttached,
    isBusy,
}: WorkspaceActionsExecuteTooltipOptions): string {
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

/**
 * Generates the tooltip text for the workspace menu action.
 *
 * @param options - Tooltip options, including shell context
 * @returns A tooltip string describing the menu action
 */
export function getWorkspaceActionsMenuTooltip({
    isDesktopShell,
}: WorkspaceActionsMenuTooltipOptions): string {
    if (!isDesktopShell) {
        return "Roblox controls require the Tauri desktop shell";
    }

    return "More actions";
}
