import type { Ace } from "ace-builds";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
    WORKSPACE_EDITOR_OPTIONS,
    WORKSPACE_EDITOR_PROPS,
    WORKSPACE_EDITOR_STYLE,
} from "../../constants/workspace/editor";
import type { AutomaticExecutionScript } from "../../lib/automaticExecution/automaticExecution.type";
import { loadAceRuntime } from "../../lib/luau/loadAceRuntime";
import type { LoadedAceRuntime } from "../../lib/luau/loadAceRuntime.type";
import { getReactAceComponent } from "../../lib/workspace/editor";
import type { AceEditorComponent } from "../../lib/workspace/editor.type";

type AutomaticExecutionEditorProps = {
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

export function AutomaticExecutionEditor({
    appTheme,
    editorFontSize,
    script,
    onChange,
    onCursorChange,
}: AutomaticExecutionEditorProps): ReactElement {
    const [AceEditorComponent, setAceEditorComponent] =
        useState<AceEditorComponent | null>(null);
    const [aceRuntime, setAceRuntime] = useState<LoadedAceRuntime | null>(null);
    const editorRef = useRef<Ace.Editor | null>(null);

    useEffect(() => {
        let isMounted = true;

        void (async () => {
            const loadedAceRuntime = await loadAceRuntime();
            const reactAceModule = await import("react-ace");
            const reactAceComponent = getReactAceComponent(reactAceModule);

            if (!isMounted) {
                return;
            }

            setAceRuntime(loadedAceRuntime);
            setAceEditorComponent(() => reactAceComponent);
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor || !script) {
            return;
        }

        editor.selection.moveCursorTo(script.cursor.line, script.cursor.column);
        editor.clearSelection();
        editor.renderer.scrollToY(script.cursor.scrollTop);
    }, [script]);

    if (!script) {
        return (
            <div className="flex h-full items-center justify-center bg-fumi-50">
                <div className="max-w-md text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                        No Script Selected
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-fumi-900">
                        Select or create a script
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-fumi-400">
                        Choose a script from the sidebar to start editing, or
                        create a new one.
                    </p>
                </div>
            </div>
        );
    }

    if (!AceEditorComponent || !aceRuntime) {
        return (
            <div className="flex h-full items-center justify-center bg-fumi-50">
                <div className="text-center">
                    <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-fumi-200 border-t-fumi-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                        Loading
                    </p>
                    <h3 className="mt-2 text-sm font-semibold tracking-[-0.01em] text-fumi-900">
                        Initializing editor
                    </h3>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-fumi-50">
            <AceEditorComponent
                className="workspace-ace-editor"
                name={`automatic-execution-editor-${script.id}`}
                value={script.content}
                mode={aceRuntime.getMode(script.fileName)}
                theme={aceRuntime.getTheme(appTheme)}
                width="100%"
                height="100%"
                fontSize={editorFontSize}
                enableBasicAutocompletion={false}
                enableLiveAutocompletion={false}
                enableSnippets={false}
                showGutter
                showPrintMargin={false}
                highlightActiveLine
                tabSize={4}
                wrapEnabled={false}
                setOptions={WORKSPACE_EDITOR_OPTIONS}
                style={WORKSPACE_EDITOR_STYLE}
                onChange={(value: string) => {
                    onChange(value);
                }}
                onLoad={(editor: Ace.Editor) => {
                    editorRef.current = editor;
                    editor.selection.moveCursorTo(
                        script.cursor.line,
                        script.cursor.column,
                    );
                    editor.clearSelection();
                    editor.renderer.scrollToY(script.cursor.scrollTop);
                }}
                onCursorChange={() => {
                    const editor = editorRef.current;

                    if (!editor) {
                        return;
                    }

                    const cursor = editor.getCursorPosition();
                    onCursorChange({
                        line: cursor.row,
                        column: cursor.column,
                        scrollTop: editor.session.getScrollTop(),
                    });
                }}
                onScroll={() => {
                    const editor = editorRef.current;

                    if (!editor) {
                        return;
                    }

                    const cursor = editor.getCursorPosition();
                    onCursorChange({
                        line: cursor.row,
                        column: cursor.column,
                        scrollTop: editor.session.getScrollTop(),
                    });
                }}
                editorProps={WORKSPACE_EDITOR_PROPS}
            />
        </div>
    );
}
