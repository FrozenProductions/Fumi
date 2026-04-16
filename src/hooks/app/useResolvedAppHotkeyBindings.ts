import { getAppHotkeyBinding } from "../../lib/app/hotkeys";
import type { ResolvedAppHotkeyBindings } from "./useAppHotkeys.type";
import { useAppStore } from "./useAppStore";

export function useResolvedAppHotkeyBindings(): ResolvedAppHotkeyBindings {
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);

    return {
        hotkeyBindings,
        openCommandPalette: getAppHotkeyBinding(
            "OPEN_COMMAND_PALETTE",
            hotkeyBindings,
        ),
        openSettings: getAppHotkeyBinding("OPEN_SETTINGS", hotkeyBindings),
        commandPaletteCommands: getAppHotkeyBinding(
            "TOGGLE_COMMAND_PALETTE_COMMANDS",
            hotkeyBindings,
        ),
        commandPaletteWorkspaces: getAppHotkeyBinding(
            "TOGGLE_COMMAND_PALETTE_WORKSPACES",
            hotkeyBindings,
        ),
        goToLine: getAppHotkeyBinding(
            "ACTIVATE_GOTO_LINE_COMMAND",
            hotkeyBindings,
        ),
        openWorkspaceDirectory: getAppHotkeyBinding(
            "OPEN_WORKSPACE_DIRECTORY",
            hotkeyBindings,
        ),
        toggleSidebar: getAppHotkeyBinding("TOGGLE_SIDEBAR", hotkeyBindings),
        openWorkspaceScreen: getAppHotkeyBinding(
            "OPEN_WORKSPACE_SCREEN",
            hotkeyBindings,
        ),
        openAutomaticExecution: getAppHotkeyBinding(
            "OPEN_AUTOMATIC_EXECUTION",
            hotkeyBindings,
        ),
        openScriptLibrary: getAppHotkeyBinding(
            "OPEN_SCRIPT_LIBRARY",
            hotkeyBindings,
        ),
        openAccounts: getAppHotkeyBinding("OPEN_ACCOUNTS", hotkeyBindings),
        createWorkspaceFile: getAppHotkeyBinding(
            "CREATE_WORKSPACE_FILE",
            hotkeyBindings,
        ),
        archiveWorkspaceTab: getAppHotkeyBinding(
            "ARCHIVE_WORKSPACE_TAB",
            hotkeyBindings,
        ),
        toggleWorkspaceSplitView: getAppHotkeyBinding(
            "TOGGLE_WORKSPACE_SPLIT_VIEW",
            hotkeyBindings,
        ),
        moveWorkspaceTabToLeftPane: getAppHotkeyBinding(
            "MOVE_WORKSPACE_TAB_TO_LEFT_PANE",
            hotkeyBindings,
        ),
        moveWorkspaceTabToRightPane: getAppHotkeyBinding(
            "MOVE_WORKSPACE_TAB_TO_RIGHT_PANE",
            hotkeyBindings,
        ),
        resetWorkspaceSplitView: getAppHotkeyBinding(
            "RESET_WORKSPACE_SPLIT_VIEW",
            hotkeyBindings,
        ),
        focusWorkspaceLeftPane: getAppHotkeyBinding(
            "FOCUS_WORKSPACE_LEFT_PANE",
            hotkeyBindings,
        ),
        focusWorkspaceRightPane: getAppHotkeyBinding(
            "FOCUS_WORKSPACE_RIGHT_PANE",
            hotkeyBindings,
        ),
    };
}
