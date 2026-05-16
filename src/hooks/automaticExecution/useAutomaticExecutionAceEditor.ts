import type { Ace } from "ace-builds";
import { useEffect, useRef, useState } from "react";
import type { AutomaticExecutionEditorProps } from "../../components/automaticExecution/AutomaticExecutionEditor.type";
import {
    applyAceEditorIndentSettings,
    isAceCursorRowVisible,
    setAceRelativeLineNumbers,
} from "../../lib/workspace/editor/editor";

type UseAutomaticExecutionAceEditorOptions = Pick<
    AutomaticExecutionEditorProps,
    | "isRelativeLineNumbersEnabled"
    | "isTabsToSpacesEnabled"
    | "onChange"
    | "onCursorChange"
    | "script"
    | "tabSize"
>;

type UseAutomaticExecutionAceEditorResult = {
    onBlur: () => void;
    onChange: (value: string) => void;
    onCursorChange: () => void;
    onFocus: () => void;
    onLoad: (editor: Ace.Editor) => void;
    onScroll: () => void;
};

function getEditorCursor(editor: Ace.Editor): {
    column: number;
    line: number;
    scrollTop: number;
} {
    const cursor = editor.getCursorPosition();

    return {
        line: cursor.row,
        column: cursor.column,
        scrollTop: editor.session.getScrollTop(),
    };
}

/**
 * Manages Ace editor state and event handlers for automatic execution scripts.
 *
 * Handles editor load, change, focus/blur, and cursor tracking. Syncs cursor
 * position and scroll state with the script data. Applies indent settings and
 * manages relative line numbers based on focus state.
 *
 * @param options - Configuration for the Ace editor
 * @param options.isRelativeLineNumbersEnabled - Whether relative line numbers are enabled
 * @param options.isTabsToSpacesEnabled - Whether tabs convert to spaces
 * @param options.onChange - Called when editor content changes
 * @param options.onCursorChange - Called when cursor position changes
 * @param options.script - The script to display in the editor
 * @param options.tabSize - The editor tab size
 * @returns Editor ref, focus/cursor state, and event handlers
 */
export function useAutomaticExecutionAceEditor({
    isRelativeLineNumbersEnabled,
    isTabsToSpacesEnabled,
    onChange,
    onCursorChange,
    script,
    tabSize,
}: UseAutomaticExecutionAceEditorOptions): UseAutomaticExecutionAceEditorResult {
    const editorRef = useRef<Ace.Editor | null>(null);
    const appliedScriptIdRef = useRef<string | null>(null);
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [isCursorRowVisible, setIsCursorRowVisible] = useState(false);

    function syncCursorState(editor: Ace.Editor): void {
        const isCursorVisible = isAceCursorRowVisible(editor);

        setIsCursorRowVisible(isCursorVisible);
        setAceRelativeLineNumbers(
            editor,
            isRelativeLineNumbersEnabled && isEditorFocused && isCursorVisible,
        );
        onCursorChange(getEditorCursor(editor));
    }

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor) {
            return;
        }

        applyAceEditorIndentSettings(editor, {
            isTabsToSpacesEnabled,
            tabSize,
        });
    }, [isTabsToSpacesEnabled, tabSize]);

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor) {
            return;
        }

        setAceRelativeLineNumbers(
            editor,
            isRelativeLineNumbersEnabled &&
                isEditorFocused &&
                isCursorRowVisible,
        );
    }, [isCursorRowVisible, isEditorFocused, isRelativeLineNumbersEnabled]);

    useEffect(() => {
        return () => {
            if (editorRef.current) {
                setAceRelativeLineNumbers(editorRef.current, false);
            }
        };
    }, []);

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor || !script) {
            appliedScriptIdRef.current = script?.id ?? null;
            return;
        }

        if (appliedScriptIdRef.current === script.id) {
            return;
        }

        appliedScriptIdRef.current = script.id;
        editor.selection.moveCursorTo(script.cursor.line, script.cursor.column);
        editor.clearSelection();
        editor.renderer.scrollToY(script.cursor.scrollTop);
    }, [script]);

    function handleFocus(): void {
        const editor = editorRef.current;
        const isCursorVisible = editor ? isAceCursorRowVisible(editor) : false;

        setIsEditorFocused(true);
        setIsCursorRowVisible(isCursorVisible);

        if (editor) {
            setAceRelativeLineNumbers(
                editor,
                isRelativeLineNumbersEnabled && isCursorVisible,
            );
        }
    }

    function handleBlur(): void {
        const editor = editorRef.current;

        setIsEditorFocused(false);
        setIsCursorRowVisible(false);

        if (editor) {
            setAceRelativeLineNumbers(editor, false);
        }
    }

    function handleLoad(editor: Ace.Editor): void {
        if (!script) {
            return;
        }

        editorRef.current = editor;
        setAceRelativeLineNumbers(editor, false);
        applyAceEditorIndentSettings(editor, {
            isTabsToSpacesEnabled,
            tabSize,
        });
        appliedScriptIdRef.current = script.id;
        editor.selection.moveCursorTo(script.cursor.line, script.cursor.column);
        editor.clearSelection();
        editor.renderer.scrollToY(script.cursor.scrollTop);
    }

    function handleCursorChange(): void {
        const editor = editorRef.current;

        if (!editor) {
            setIsCursorRowVisible(false);
            return;
        }

        syncCursorState(editor);
    }

    function handleScroll(): void {
        const editor = editorRef.current;

        if (!editor) {
            setIsCursorRowVisible(false);
            return;
        }

        syncCursorState(editor);
    }

    return {
        onBlur: handleBlur,
        onChange,
        onCursorChange: handleCursorChange,
        onFocus: handleFocus,
        onLoad: handleLoad,
        onScroll: handleScroll,
    };
}
