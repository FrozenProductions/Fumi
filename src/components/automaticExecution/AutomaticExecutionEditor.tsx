import { Add01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import emptyAddIcon from "../../assets/icons/empty_add.svg";
import {
    WORKSPACE_EDITOR_OPTIONS,
    WORKSPACE_EDITOR_PROPS,
    WORKSPACE_EDITOR_STYLE,
} from "../../constants/workspace/editor";
import { useAutomaticExecutionAceEditor } from "../../hooks/automaticExecution/useAutomaticExecutionAceEditor";
import { loadAceRuntime } from "../../lib/luau/ace/loadAceRuntime";
import type { LoadedAceRuntime } from "../../lib/luau/ace/loadAceRuntime.type";
import { joinClassNames } from "../../lib/shared/className";
import { createMaskStyle } from "../../lib/shared/mask";
import { getReactAceComponent } from "../../lib/workspace/editor/editor";
import type { AceEditorComponent } from "../../lib/workspace/editor/editor.type";
import { AppIcon } from "../app/common/AppIcon";
import type { AutomaticExecutionEditorProps } from "./AutomaticExecutionEditor.type";

const EMPTY_ADD_ICON_STYLE = createMaskStyle(emptyAddIcon);

type AutomaticExecutionEditorLoaderState = {
    AceEditor: AceEditorComponent;
    aceRuntime: LoadedAceRuntime;
};

/**
 * The Ace editor for automatic execution scripts.
 *
 * @param props - Component props
 * @param props.appTheme - Current app theme
 * @param props.editorFontSize - Editor font size
 * @param props.script - The active script to edit
 * @param props.onChange - Called when content changes
 * @param props.onCursorChange - Called when cursor moves
 * @returns A React component
 */
export function AutomaticExecutionEditor({
    appTheme,
    cursorStyle,
    editorFontSize,
    isSmoothCaretEnabled,
    isScopeHighlightingEnabled,
    isRelativeLineNumbersEnabled,
    isWordWrapEnabled,
    isTabsToSpacesEnabled,
    tabSize,
    script,
    onCreateScript,
    onChange,
    onCursorChange,
}: AutomaticExecutionEditorProps): ReactElement {
    const [editorLoaderState, setEditorLoaderState] =
        useState<AutomaticExecutionEditorLoaderState | null>(null);
    const aceEditorHandlers = useAutomaticExecutionAceEditor({
        isRelativeLineNumbersEnabled,
        isTabsToSpacesEnabled,
        onChange,
        onCursorChange,
        script,
        tabSize,
    });
    const editorOptions = {
        ...WORKSPACE_EDITOR_OPTIONS,
        animatedScroll: isSmoothCaretEnabled,
        cursorStyle,
        relativeLineNumbers: false,
        useSoftTabs: isTabsToSpacesEnabled,
    } as const;
    const editorClassName = joinClassNames(
        "workspace-ace-editor",
        isSmoothCaretEnabled && "workspace-ace-editor-smooth-caret",
        !isScopeHighlightingEnabled &&
            "workspace-ace-editor-disable-scope-highlight",
    );

    useEffect(() => {
        if (!script || editorLoaderState) {
            return;
        }

        let isMounted = true;

        void (async () => {
            const [loadedAceRuntime, reactAceModule] = await Promise.all([
                loadAceRuntime(),
                import("react-ace"),
            ]);
            const reactAceComponent = getReactAceComponent(reactAceModule);

            if (!isMounted) {
                return;
            }

            setEditorLoaderState({
                AceEditor: reactAceComponent,
                aceRuntime: loadedAceRuntime,
            });
        })();

        return () => {
            isMounted = false;
        };
    }, [editorLoaderState, script]);

    if (!script) {
        return (
            <div className="flex h-full items-center justify-center bg-fumi-50 p-8">
                <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                    <div
                        aria-hidden="true"
                        className="mx-auto size-24 bg-fumi-600"
                        style={EMPTY_ADD_ICON_STYLE}
                    />
                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                        No Script Selected
                    </p>
                    <p className="mt-4 text-base leading-7 text-fumi-400">
                        Create a script or pick one from the sidebar to start
                        editing automatic execution.
                    </p>
                    <button
                        type="button"
                        onClick={onCreateScript}
                        className="app-select-none mt-6 inline-flex h-10 items-center gap-2 rounded-[0.8rem] border border-fumi-200 bg-fumi-600 px-4 text-sm font-semibold tracking-[0.01em] text-white transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                    >
                        <AppIcon icon={Add01Icon} size={16} strokeWidth={2.4} />
                        Create script
                    </button>
                </div>
            </div>
        );
    }

    if (!editorLoaderState) {
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

    const { AceEditor, aceRuntime } = editorLoaderState;

    return (
        <div className="h-full bg-fumi-50">
            <AceEditor
                className={editorClassName}
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
                tabSize={tabSize}
                wrapEnabled={isWordWrapEnabled}
                setOptions={editorOptions}
                style={WORKSPACE_EDITOR_STYLE}
                onChange={aceEditorHandlers.onChange}
                onFocus={aceEditorHandlers.onFocus}
                onBlur={aceEditorHandlers.onBlur}
                onLoad={aceEditorHandlers.onLoad}
                onCursorChange={aceEditorHandlers.onCursorChange}
                onScroll={aceEditorHandlers.onScroll}
                editorProps={WORKSPACE_EDITOR_PROPS}
            />
        </div>
    );
}
