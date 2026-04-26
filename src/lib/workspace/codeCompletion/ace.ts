import { LUAU_MODE_IDENTIFIER } from "../../../constants/luau/core/luau";
import { disableTextInputCorrections } from "../../app/textInput";
import type { AceEditorInstance, AceSessionWithMode } from "./ace.type";

/**
 * Returns whether the active editor mode is Luau and the Ace session matches the Luau mode.
 */
export function isLuauEditorSession(
    editor: AceEditorInstance,
    activeEditorMode: string,
): boolean {
    return (
        activeEditorMode === "luau" &&
        (editor.session as AceSessionWithMode).$mode?.$id ===
            LUAU_MODE_IDENTIFIER
    );
}

/**
 * Configures Ace editor keybindings and disables text input corrections for a workspace editor.
 */
export function bindWorkspaceEditorShortcuts(
    editor: AceEditorInstance,
    onToggleSearch: () => void,
): void {
    editor.commands.removeCommand("showSettingsMenu");
    editor.commands.removeCommand("find");
    editor.commands.bindKey("Command-\\", "null");
    editor.commands.bindKey("Command-Shift-\\", "null");
    editor.commands.addCommand({
        name: "find",
        bindKey: {
            win: "Ctrl-F",
            mac: "Command-F",
        },
        exec: onToggleSearch,
        readOnly: true,
    });
    editor.commands.bindKey(
        {
            win: "Ctrl-A",
            mac: "Command-A",
        },
        "selectall",
    );
    disableTextInputCorrections(editor.textInput.getElement());
}

/**
 * Returns whether inserted text looks like a passive (typing-triggered) completion character.
 */
export function isPassiveCompletionTrigger(insertedText: string): boolean {
    return insertedText.length > 0 && /[A-Za-z0-9_.:]$/.test(insertedText);
}
