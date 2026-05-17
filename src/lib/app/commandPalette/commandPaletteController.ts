import { APP_COMMAND_PALETTE_MAX_RESULTS } from "../../../constants/app/commandPalette";
import { getAppHotkeyShortcutLabel } from "../hotkeys/hotkeys";
import type { AppHotkeyBindings } from "../hotkeys/hotkeys.type";
import type {
    AppCommandPaletteHotkeyLabels,
    GetAppCommandPaletteResultsOptions,
} from "./commandPalette.type";
import {
    getAttachCommandPaletteItems,
    getGoToLineCommandPaletteItems,
    getIntellisensePriorityCommandPaletteItems,
    getSymbolCommandPaletteItems,
    getTabSizeCommandPaletteItems,
    getThemeCommandPaletteItems,
} from "./commandPaletteModes";
import { getCommandCommandPaletteItems } from "./commands/commandPaletteCommands";
import { getTabCommandPaletteItems } from "./items/commandPaletteTabs";
import { getWorkspaceCommandPaletteItems } from "./items/commandPaletteWorkspaces";
import { searchAppCommandPaletteItems } from "./search/commandPaletteSearch";

/**
 * Builds shortcut labels for all command palette hotkey actions.
 */
function getAppCommandPaletteHotkeyLabels(
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
        executeActiveTab: getAppHotkeyShortcutLabel(
            "EXECUTE_ACTIVE_TAB",
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
    editorSettings,
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
    onSetEditorIntellisenseEnabled,
    onSetEditorIntellisensePriority,
    onSetEditorRelativeLineNumbersEnabled,
    onSetEditorScopeHighlightingEnabled,
    onSetEditorSmoothCaretEnabled,
    onSetEditorTabSize,
    onSetEditorWordWrapEnabled,
    hotkeyBindings,
    activeTab,
    goToLineNumber,
    mode,
    scope,
    normalizedQuery,
    onActivateAttachMode,
    onActivateGoToLineMode,
    onActivateIntellisensePriorityMode,
    onActivateSymbolMode,
    onActivateTabSizeMode,
    onActivateThemeMode,
}: GetAppCommandPaletteResultsOptions) {
    if (mode === "attach") {
        return searchAppCommandPaletteItems(
            getAttachCommandPaletteItems({
                workspaceExecutor,
                onOpenWorkspaceScreen,
            }),
            normalizedQuery,
            APP_COMMAND_PALETTE_MAX_RESULTS,
        );
    }

    if (mode === "goto-line") {
        return getGoToLineCommandPaletteItems({
            activeTab,
            goToLineNumber,
            onGoToLine,
        });
    }

    if (mode === "symbol") {
        return searchAppCommandPaletteItems(
            getSymbolCommandPaletteItems({
                activeTab,
                onGoToLine,
                onOpenWorkspaceScreen,
            }),
            normalizedQuery,
            APP_COMMAND_PALETTE_MAX_RESULTS,
        );
    }

    if (mode === "intellisense-priority") {
        return getIntellisensePriorityCommandPaletteItems({
            currentPriority: editorSettings.intellisensePriority,
            onSetPriority: onSetEditorIntellisensePriority,
        });
    }

    if (mode === "tab-size") {
        return getTabSizeCommandPaletteItems({
            currentTabSize: editorSettings.tabSize,
            onSetTabSize: onSetEditorTabSize,
        });
    }

    if (mode === "theme") {
        return getThemeCommandPaletteItems({
            currentTheme: theme,
            onSetTheme,
        });
    }

    if (scope === "commands") {
        return searchAppCommandPaletteItems(
            getCommandCommandPaletteItems({
                workspaceSession,
                workspaceExecutor,
                isSidebarOpen,
                activeSidebarItem,
                sidebarPosition,
                editorSettings,
                hotkeyLabels: getAppCommandPaletteHotkeyLabels(hotkeyBindings),
                onActivateAttachMode,
                onActivateGoToLineMode,
                onActivateIntellisensePriorityMode,
                onActivateSymbolMode,
                onActivateTabSizeMode,
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
                onSetEditorIntellisenseEnabled,
                onSetEditorIntellisensePriority,
                onSetEditorRelativeLineNumbersEnabled,
                onSetEditorScopeHighlightingEnabled,
                onSetEditorSmoothCaretEnabled,
                onSetEditorTabSize,
                onSetEditorWordWrapEnabled,
                isOutlinePanelVisible,
            }),
            normalizedQuery,
            APP_COMMAND_PALETTE_MAX_RESULTS,
        );
    }

    if (scope === "workspaces") {
        return searchAppCommandPaletteItems(
            getWorkspaceCommandPaletteItems(workspaceSession),
            normalizedQuery,
            APP_COMMAND_PALETTE_MAX_RESULTS,
        );
    }

    return searchAppCommandPaletteItems(
        getTabCommandPaletteItems(workspaceSession),
        normalizedQuery,
        APP_COMMAND_PALETTE_MAX_RESULTS,
    );
}
