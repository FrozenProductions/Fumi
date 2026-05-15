import { useEffect, useRef, useState } from "react";
import type { WorkspaceAcePaneProps } from "../../components/workspace/editor/WorkspaceEditorSurface.type";
import type {
    AceChangeDelta,
    AceEditorInstance,
} from "../../lib/workspace/codeCompletion/ace.type";
import {
    applyAceEditorIndentSettings,
    isAceCursorRowVisible,
    setAceRelativeLineNumbers,
} from "../../lib/workspace/editor/editor";
import type { WorkspaceOutlineChange } from "../../lib/workspace/outline/outline.type";

type UseWorkspaceAcePaneHandlersOptions = Pick<
    WorkspaceAcePaneProps,
    | "createHandleEditorChange"
    | "createHandleEditorLoad"
    | "createHandleEditorUnmount"
    | "createHandleScroll"
    | "isActiveTab"
    | "isRelativeLineNumbersEnabled"
    | "isTabsToSpacesEnabled"
    | "isVisible"
    | "onActiveTabLuauChange"
    | "tab"
    | "tabSize"
>;

type UseWorkspaceAcePaneHandlersResult = {
    onBlur: () => void;
    onChange: (value: string, delta?: AceChangeDelta) => void;
    onCursorChange: () => void;
    onFocus: () => void;
    onLoad: (editor: AceEditorInstance) => void;
    onScroll: (editor: AceEditorInstance) => void;
};

function normalizeOutlineChange(
    delta?: AceChangeDelta,
): WorkspaceOutlineChange | null {
    if (
        !delta?.action ||
        !delta.start ||
        !delta.end ||
        !Array.isArray(delta.lines)
    ) {
        return null;
    }

    return {
        action: delta.action,
        end: delta.end,
        lines: delta.lines,
        start: delta.start,
    };
}

export function useWorkspaceAcePaneHandlers({
    createHandleEditorChange,
    createHandleEditorLoad,
    createHandleEditorUnmount,
    createHandleScroll,
    isActiveTab,
    isRelativeLineNumbersEnabled,
    isTabsToSpacesEnabled,
    isVisible,
    onActiveTabLuauChange,
    tab,
    tabSize,
}: UseWorkspaceAcePaneHandlersOptions): UseWorkspaceAcePaneHandlersResult {
    const editorRef = useRef<AceEditorInstance | null>(null);
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [isCursorRowVisible, setIsCursorRowVisible] = useState(false);
    const editorChangeHandler = createHandleEditorChange(tab.id);

    function applyRelativeLineNumbers(
        editor: AceEditorInstance,
        isCursorVisible: boolean,
    ): void {
        setAceRelativeLineNumbers(
            editor,
            isRelativeLineNumbersEnabled &&
                isEditorFocused &&
                isCursorVisible &&
                isVisible,
        );
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
                isCursorRowVisible &&
                isVisible,
        );
    }, [
        isCursorRowVisible,
        isEditorFocused,
        isRelativeLineNumbersEnabled,
        isVisible,
    ]);

    useEffect(() => {
        if (isVisible) {
            return;
        }

        if (editorRef.current) {
            setAceRelativeLineNumbers(editorRef.current, false);
        }

        setIsEditorFocused(false);
        setIsCursorRowVisible(false);
    }, [isVisible]);

    useEffect(() => {
        return () => {
            if (editorRef.current) {
                setAceRelativeLineNumbers(editorRef.current, false);
            }
        };
    }, []);

    useEffect(
        () => createHandleEditorUnmount(tab.id),
        [createHandleEditorUnmount, tab.id],
    );

    function handleLoad(editor: AceEditorInstance): void {
        editorRef.current = editor;
        setAceRelativeLineNumbers(editor, false);
        applyAceEditorIndentSettings(editor, {
            isTabsToSpacesEnabled,
            tabSize,
        });
        createHandleEditorLoad(tab.id)(editor);
    }

    function handleChange(value: string, delta?: AceChangeDelta): void {
        if (isActiveTab) {
            onActiveTabLuauChange(normalizeOutlineChange(delta));
        }

        editorChangeHandler(value, delta);
    }

    function handleScroll(editor: AceEditorInstance): void {
        const isCursorVisible = isAceCursorRowVisible(editor);

        createHandleScroll(tab.id)(editor);
        setIsCursorRowVisible(isCursorVisible);
        applyRelativeLineNumbers(editor, isCursorVisible);
    }

    function handleFocus(): void {
        const editor = editorRef.current;
        const isCursorVisible = editor ? isAceCursorRowVisible(editor) : false;

        setIsEditorFocused(true);
        setIsCursorRowVisible(isCursorVisible);

        if (editor) {
            setAceRelativeLineNumbers(
                editor,
                isRelativeLineNumbersEnabled && isCursorVisible && isVisible,
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

    function handleCursorChange(): void {
        const editor = editorRef.current;
        const isCursorVisible = editor ? isAceCursorRowVisible(editor) : false;

        setIsCursorRowVisible(isCursorVisible);

        if (editor) {
            applyRelativeLineNumbers(editor, isCursorVisible);
        }
    }

    return {
        onBlur: handleBlur,
        onChange: handleChange,
        onCursorChange: handleCursorChange,
        onFocus: handleFocus,
        onLoad: handleLoad,
        onScroll: handleScroll,
    };
}
