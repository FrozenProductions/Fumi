import type { Ace } from "ace-builds";
import { disableTextInputCorrections } from "../../../lib/app/textInput";
import { LUAU_MODE_IDENTIFIER } from "../../../lib/luau/completion";

export type AceEditorInstance = Ace.Editor;
export type AceRendererInstance = Ace.VirtualRenderer & {
    $cursorLayer: {
        getPixelPosition: (
            position: Ace.Point,
            onScreen?: boolean,
        ) => {
            left: number;
            top: number;
        };
    };
};

type AceSessionWithMode = Ace.EditSession & {
    $mode?: {
        $id?: string;
    };
};

export type AceChangeDelta = {
    action?: "insert" | "remove";
    lines?: string[];
};

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
    onOpenSearch: () => void,
): void {
    editor.commands.removeCommand("showSettingsMenu");
    editor.commands.removeCommand("find");
    editor.commands.addCommand({
        name: "find",
        bindKey: {
            win: "Ctrl-F",
            mac: "Command-F",
        },
        exec: onOpenSearch,
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
