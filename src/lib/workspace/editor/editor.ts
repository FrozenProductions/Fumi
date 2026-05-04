import type { AppEditorTabSize } from "../../app/app.type";
import type { AceEditorInstance } from "../codeCompletion/ace.type";
import type { AceEditorComponent } from "./editor.type";

const FUMI_INDENT_COMMAND_NAME = "fumi-indent";

function getIndentText(options: {
    isTabsToSpacesEnabled: boolean;
    tabSize: AppEditorTabSize;
}): string {
    return options.isTabsToSpacesEnabled ? " ".repeat(options.tabSize) : "\t";
}

function getSelectedIndentEndRow(editor: AceEditorInstance): number {
    const range = editor.getSelectionRange();

    if (range.end.column === 0 && range.end.row > range.start.row) {
        return range.end.row - 1;
    }

    return range.end.row;
}

function applyFumiIndentCommand(
    editor: AceEditorInstance,
    options: {
        isTabsToSpacesEnabled: boolean;
        tabSize: AppEditorTabSize;
    },
): void {
    editor.commands.addCommand({
        name: FUMI_INDENT_COMMAND_NAME,
        bindKey: {
            mac: "Tab",
            win: "Tab",
        },
        exec: (commandEditor?: AceEditorInstance): void => {
            const activeEditor = commandEditor ?? editor;
            const indentText = getIndentText(options);

            if (activeEditor.selection.isEmpty()) {
                activeEditor.insert(indentText);
                return;
            }

            const range = activeEditor.getSelectionRange();
            activeEditor
                .getSession()
                .indentRows(
                    range.start.row,
                    getSelectedIndentEndRow(activeEditor),
                    indentText,
                );
        },
        multiSelectAction: "forEach",
        scrollIntoView: "selectionPart",
    });
}

/**
 * Resolves the React Ace editor component from a dynamic import, handling nested default exports.
 *
 * @throws {Error} If the editor component export is unavailable.
 */
export function getReactAceComponent(
    reactAceModule: typeof import("react-ace"),
): AceEditorComponent {
    const defaultExport: unknown = reactAceModule.default;

    if (typeof defaultExport === "function") {
        return defaultExport as AceEditorComponent;
    }

    if (
        defaultExport &&
        typeof defaultExport === "object" &&
        "default" in defaultExport &&
        typeof defaultExport.default === "function"
    ) {
        return defaultExport.default as AceEditorComponent;
    }

    throw new Error("React Ace component export is unavailable");
}

/**
 * Applies indentation settings directly to Ace's session, which owns Tab insertion behavior.
 */
export function applyAceEditorIndentSettings(
    editor: AceEditorInstance,
    options: {
        isTabsToSpacesEnabled: boolean;
        tabSize: AppEditorTabSize;
    },
): void {
    const session = editor.getSession();

    session.setUseSoftTabs(options.isTabsToSpacesEnabled);
    session.setTabSize(options.tabSize);
    session.setNavigateWithinSoftTabs(options.isTabsToSpacesEnabled);
    applyFumiIndentCommand(editor, options);
}
