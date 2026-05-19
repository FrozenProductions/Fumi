import { getAppHotkeyBinding } from "../../../lib/app/hotkeys/hotkeys";
import { useAppStore } from "../useAppStore";
import type { ResolvedAppHotkeyBindings } from "./useAppHotkeys.type";

/** Resolves all app hotkey bindings from store state, returning null for disabled actions. */
export function useResolvedAppHotkeyBindings(): ResolvedAppHotkeyBindings {
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const disabledHotkeys = useAppStore((state) => state.disabledHotkeys);

    return {
        hotkeyBindings,
        disabledHotkeys,
        openCommandPalette: getAppHotkeyBinding(
            "OPEN_COMMAND_PALETTE",
            hotkeyBindings,
            disabledHotkeys,
        ),
        openSettings: getAppHotkeyBinding(
            "OPEN_SETTINGS",
            hotkeyBindings,
            disabledHotkeys,
        ),
        commandPaletteCommands: getAppHotkeyBinding(
            "TOGGLE_COMMAND_PALETTE_COMMANDS",
            hotkeyBindings,
            disabledHotkeys,
        ),
        commandPaletteWorkspaces: getAppHotkeyBinding(
            "TOGGLE_COMMAND_PALETTE_WORKSPACES",
            hotkeyBindings,
            disabledHotkeys,
        ),
        goToLine: getAppHotkeyBinding(
            "ACTIVATE_GOTO_LINE_COMMAND",
            hotkeyBindings,
            disabledHotkeys,
        ),
        openWorkspaceDirectory: getAppHotkeyBinding(
            "OPEN_WORKSPACE_DIRECTORY",
            hotkeyBindings,
            disabledHotkeys,
        ),
        toggleSidebar: getAppHotkeyBinding(
            "TOGGLE_SIDEBAR",
            hotkeyBindings,
            disabledHotkeys,
        ),
        openWorkspaceScreen: getAppHotkeyBinding(
            "OPEN_WORKSPACE_SCREEN",
            hotkeyBindings,
            disabledHotkeys,
        ),
        openAutomaticExecution: getAppHotkeyBinding(
            "OPEN_AUTOMATIC_EXECUTION",
            hotkeyBindings,
            disabledHotkeys,
        ),
        openScriptLibrary: getAppHotkeyBinding(
            "OPEN_SCRIPT_LIBRARY",
            hotkeyBindings,
            disabledHotkeys,
        ),
        openAccounts: getAppHotkeyBinding(
            "OPEN_ACCOUNTS",
            hotkeyBindings,
            disabledHotkeys,
        ),
        createWorkspaceFile: getAppHotkeyBinding(
            "CREATE_WORKSPACE_FILE",
            hotkeyBindings,
            disabledHotkeys,
        ),
        archiveWorkspaceTab: getAppHotkeyBinding(
            "ARCHIVE_WORKSPACE_TAB",
            hotkeyBindings,
            disabledHotkeys,
        ),
        toggleWorkspaceSplitView: getAppHotkeyBinding(
            "TOGGLE_WORKSPACE_SPLIT_VIEW",
            hotkeyBindings,
            disabledHotkeys,
        ),
        moveWorkspaceTabToLeftPane: getAppHotkeyBinding(
            "MOVE_WORKSPACE_TAB_TO_LEFT_PANE",
            hotkeyBindings,
            disabledHotkeys,
        ),
        moveWorkspaceTabToRightPane: getAppHotkeyBinding(
            "MOVE_WORKSPACE_TAB_TO_RIGHT_PANE",
            hotkeyBindings,
            disabledHotkeys,
        ),
        resetWorkspaceSplitView: getAppHotkeyBinding(
            "RESET_WORKSPACE_SPLIT_VIEW",
            hotkeyBindings,
            disabledHotkeys,
        ),
        focusWorkspaceLeftPane: getAppHotkeyBinding(
            "FOCUS_WORKSPACE_LEFT_PANE",
            hotkeyBindings,
            disabledHotkeys,
        ),
        focusWorkspaceRightPane: getAppHotkeyBinding(
            "FOCUS_WORKSPACE_RIGHT_PANE",
            hotkeyBindings,
            disabledHotkeys,
        ),
        toggleExecutorConnection: getAppHotkeyBinding(
            "TOGGLE_EXECUTOR_CONNECTION",
            hotkeyBindings,
            disabledHotkeys,
        ),
        executeActiveTab: getAppHotkeyBinding(
            "EXECUTE_ACTIVE_TAB",
            hotkeyBindings,
            disabledHotkeys,
        ),
    };
}
