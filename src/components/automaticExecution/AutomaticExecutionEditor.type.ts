import type { AutomaticExecutionScript } from "../../lib/automaticExecution/automaticExecution.type";

export type AutomaticExecutionEditorProps = {
    appTheme: "system" | "light" | "dark";
    editorFontSize: number;
    script: AutomaticExecutionScript | null;
    onChange: (content: string) => void;
    onCursorChange: (cursor: {
        line: number;
        column: number;
        scrollTop: number;
    }) => void;
};
