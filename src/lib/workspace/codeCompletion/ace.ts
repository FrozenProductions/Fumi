import { LUAU_MODE_IDENTIFIER } from "../../../constants/luau/core/luau";
import { disableTextInputCorrections } from "../../app/textInput";
import type { AceEditorInstance, AceSessionWithMode } from "./ace.type";

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

export function bindWorkspaceEditorShortcuts(
    editor: AceEditorInstance,
    onToggleSearch: () => void,
): void {
    editor.commands.removeCommand("showSettingsMenu");
    editor.commands.removeCommand("find");
    editor.commands.bindKey("Command-\\", "null");
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

export function isPassiveCompletionTrigger(insertedText: string): boolean {
    return insertedText.length > 0 && /[A-Za-z0-9_.:]$/.test(insertedText);
}
