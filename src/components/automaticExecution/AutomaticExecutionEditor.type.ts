import type { AppEditorTabSize } from "../../lib/app/app.type";
import type { AutomaticExecutionScript } from "../../lib/automaticExecution/automaticExecution.type";

export type AutomaticExecutionEditorProps = {
    appTheme: "system" | "light" | "dark";
    editorFontSize: number;
    isWordWrapEnabled: boolean;
    isTabsToSpacesEnabled: boolean;
    tabSize: AppEditorTabSize;
    script: AutomaticExecutionScript | null;
    onCreateScript: () => void;
    onChange: (content: string) => void;
    onCursorChange: (cursor: {
        line: number;
        column: number;
        scrollTop: number;
    }) => void;
};
