import { APP_COMMAND_PALETTE_MAX_RESULTS } from "../../../constants/app/commandPalette";
import { getAppHotkeyShortcutLabel } from "../hotkeys/hotkeys";
import type { AppHotkeyBindings } from "../hotkeys/hotkeys.type";
import {
    getAttachCommandPaletteItems,
    getCommandCommandPaletteItems,
    getGoToLineCommandPaletteItems,
    getTabCommandPaletteItems,
    getThemeCommandPaletteItems,
    getWorkspaceCommandPaletteItems,
} from "./commandPalette";
import type {
    AppCommandPaletteHotkeyLabels,
    GetAppCommandPaletteResultsOptions,
} from "./commandPalette.type";
import { searchAppCommandPaletteItems } from "./search/commandPaletteSearch";

/**
 * Builds shortcut labels for all command palette hotkey actions.
 */
export function getAppCommandPaletteHotkeyLabels(
    hotkeyBindings: AppHotkeyBindings,
): AppCommandPaletteHotkeyLabels {
    return {
        activateGoToLine: getAppHotkeyShortcutLabel(
            "ACTIVATE_GOTO_LINE_COMMAND",
            hotkeyBindings,
        ),
        archiveWorkspaceTab: getAppHotkeyShortcutLabel(
            "ARCHIVE_WORKSPACE_TAB",
            hotkeyBindings,
        ),
        toggleExecutorConnection: getAppHotkeyShortcutLabel(
            "TOGGLE_EXECUTOR_CONNECTION",
            hotkeyBindings,
        ),
        createWorkspaceFile: getAppHotkeyShortcutLabel(
            "CREATE_WORKSPACE_FILE",
            hotkeyBindings,
        ),
        focusWorkspaceLeftPane: getAppHotkeyShortcutLabel(
            "FOCUS_WORKSPACE_LEFT_PANE",
            hotkeyBindings,
        ),
        focusWorkspaceRightPane: getAppHotkeyShortcutLabel(
            "FOCUS_WORKSPACE_RIGHT_PANE",
            hotkeyBindings,
        ),
        killRoblox: getAppHotkeyShortcutLabel("KILL_ROBLOX", hotkeyBindings),
        launchRoblox: getAppHotkeyShortcutLabel(
            "LAUNCH_ROBLOX",
            hotkeyBindings,
        ),
        moveWorkspaceTabToLeftPane: getAppHotkeyShortcutLabel(
            "MOVE_WORKSPACE_TAB_TO_LEFT_PANE",
            hotkeyBindings,
        ),
        moveWorkspaceTabToRightPane: getAppHotkeyShortcutLabel(
            "MOVE_WORKSPACE_TAB_TO_RIGHT_PANE",
            hotkeyBindings,
        ),
        openAccounts: getAppHotkeyShortcutLabel(
            "OPEN_ACCOUNTS",
            hotkeyBindings,
        ),
        openSettings: getAppHotkeyShortcutLabel(
            "OPEN_SETTINGS",
            hotkeyBindings,
        ),
        openWorkspaceDirectory: getAppHotkeyShortcutLabel(
            "OPEN_WORKSPACE_DIRECTORY",
            hotkeyBindings,
        ),
        openWorkspaceScreen: getAppHotkeyShortcutLabel(
            "OPEN_WORKSPACE_SCREEN",
            hotkeyBindings,
        ),
        openAutomaticExecution: getAppHotkeyShortcutLabel(
            "OPEN_AUTOMATIC_EXECUTION",
            hotkeyBindings,
        ),
        openScriptLibrary: getAppHotkeyShortcutLabel(
            "OPEN_SCRIPT_LIBRARY",
            hotkeyBindings,
        ),
        resetWorkspaceSplitView: getAppHotkeyShortcutLabel(
            "RESET_WORKSPACE_SPLIT_VIEW",
            hotkeyBindings,
        ),
        toggleSidebar: getAppHotkeyShortcutLabel(
            "TOGGLE_SIDEBAR",
            hotkeyBindings,
        ),
        toggleOutlinePanel: getAppHotkeyShortcutLabel(
            "TOGGLE_OUTLINE_PANEL",
            hotkeyBindings,
        ),
        toggleWorkspaceSplitView: getAppHotkeyShortcutLabel(
            "TOGGLE_WORKSPACE_SPLIT_VIEW",
            hotkeyBindings,
        ),
        toggleSidebarPosition: "",
    };
}

/**
 * Computes command palette results based on the current mode, scope, and search query.
 */
export function getAppCommandPaletteResults({
    workspaceSession,
    workspaceExecutor,
    isSidebarOpen,
    activeSidebarItem,
    theme,
    sidebarPosition,
    onGoToLine,
    onOpenWorkspaceScreen,
    onOpenAutomaticExecution,
    onOpenScriptLibrary,
    onOpenAccounts,
    onOpenExecutionHistory,
    onToggleSidebar,
    onToggleOutlinePanel,
    onOpenSettings,
    isOutlinePanelVisible,
    onSetTheme,
    onSetSidebarPosition,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onRequestRenameCurrentTab,
    hotkeyBindings,
    activeTab,
    goToLineNumber,
    mode,
    scope,
    normalizedQuery,
    onActivateAttachMode,
    onActivateGoToLineMode,
    onActivateThemeMode,
}: GetAppCommandPaletteResultsOptions) {
    const tabItems = getTabCommandPaletteItems(workspaceSession);
    const commandItems = getCommandCommandPaletteItems({
        workspaceSession,
        workspaceExecutor,
        isSidebarOpen,
        activeSidebarItem,
        sidebarPosition,
        hotkeyLabels: getAppCommandPaletteHotkeyLabels(hotkeyBindings),
        onActivateAttachMode,
        onActivateGoToLineMode,
        onActivateThemeMode,
        onOpenWorkspaceScreen,
        onOpenAutomaticExecution,
        onOpenScriptLibrary,
        onOpenAccounts,
        onOpenExecutionHistory,
        onOpenSettings,
        onToggleSidebar,
        onToggleOutlinePanel,
        onSetSidebarPosition,
        onZoomIn,
        onZoomOut,
        onZoomReset,
        onRequestRenameCurrentTab,
        isOutlinePanelVisible,
    });
    const workspaceItems = getWorkspaceCommandPaletteItems(workspaceSession);
    const goToLineItems = getGoToLineCommandPaletteItems({
        activeTab,
        goToLineNumber,
        onGoToLine,
    });
    const attachItems = getAttachCommandPaletteItems({
        workspaceExecutor,
        onOpenWorkspaceScreen,
    });
    const themeItems = getThemeCommandPaletteItems({
        currentTheme: theme,
        onSetTheme,
    });

    if (mode === "attach") {
        return searchAppCommandPaletteItems(
            attachItems,
            normalizedQuery,
            APP_COMMAND_PALETTE_MAX_RESULTS,
        );
    }

    if (mode === "goto-line") {
        return goToLineItems;
    }

    if (mode === "theme") {
        return themeItems;
    }

    const scopedItems =
        scope === "commands"
            ? commandItems
            : scope === "workspaces"
              ? workspaceItems
              : tabItems;

    return searchAppCommandPaletteItems(
        scopedItems,
        normalizedQuery,
        APP_COMMAND_PALETTE_MAX_RESULTS,
    );
}
