import type {
    WorkspaceActionsExecuteTooltipOptions,
    WorkspaceActionsMenuTooltipOptions,
} from "./workspaceActionsTooltip.type";

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

export function getWorkspaceActionsMenuTooltip({
    isDesktopShell,
}: WorkspaceActionsMenuTooltipOptions): string {
    if (!isDesktopShell) {
        return "Roblox controls require the Tauri desktop shell";
    }

    return "More actions";
}
