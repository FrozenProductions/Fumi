import { useEffect, useReducer, useRef } from "react";
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
import type {
    UseWorkspaceAcePaneHandlersOptions,
    UseWorkspaceAcePaneHandlersResult,
    WorkspaceAcePaneInteractionState,
} from "./useWorkspaceAcePaneHandlers.type";

function updateWorkspaceAcePaneInteractionState(
    currentState: WorkspaceAcePaneInteractionState,
    nextState: Partial<WorkspaceAcePaneInteractionState>,
): WorkspaceAcePaneInteractionState {
    return {
        ...currentState,
        ...nextState,
    };
}

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
    const editorHostRef = useRef<HTMLDivElement | null>(null);
    const [interactionState, setInteractionState] = useReducer(
        updateWorkspaceAcePaneInteractionState,
        {
            isEditorFocused: false,
            isCursorRowVisible: false,
        },
    );
    const { isEditorFocused, isCursorRowVisible } = interactionState;
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

        setInteractionState({
            isEditorFocused: false,
            isCursorRowVisible: false,
        });
    }, [isVisible]);

    useEffect(() => {
        return () => {
            if (editorRef.current) {
                setAceRelativeLineNumbers(editorRef.current, false);
            }
        };
    }, []);

    useEffect(() => {
        const host = editorHostRef.current;

        if (!host || typeof ResizeObserver === "undefined") {
            return;
        }

        let animationFrameId: number | null = null;

        const resizeEditor = (): void => {
            if (animationFrameId !== null) {
                window.cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = window.requestAnimationFrame(() => {
                animationFrameId = null;

                if (!isVisible) {
                    return;
                }

                editorRef.current?.resize();
            });
        };
        const resizeObserver = new ResizeObserver(resizeEditor);

        resizeObserver.observe(host);
        resizeEditor();

        return () => {
            if (animationFrameId !== null) {
                window.cancelAnimationFrame(animationFrameId);
            }

            resizeObserver.disconnect();
        };
    }, [isVisible]);

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
        setInteractionState({ isCursorRowVisible: isCursorVisible });
        applyRelativeLineNumbers(editor, isCursorVisible);
    }

    function handleFocus(): void {
        const editor = editorRef.current;
        const isCursorVisible = editor ? isAceCursorRowVisible(editor) : false;

        setInteractionState({
            isEditorFocused: true,
            isCursorRowVisible: isCursorVisible,
        });

        if (editor) {
            setAceRelativeLineNumbers(
                editor,
                isRelativeLineNumbersEnabled && isCursorVisible && isVisible,
            );
        }
    }

    function handleBlur(): void {
        const editor = editorRef.current;

        setInteractionState({
            isEditorFocused: false,
            isCursorRowVisible: false,
        });

        if (editor) {
            setAceRelativeLineNumbers(editor, false);
        }
    }

    function handleCursorChange(): void {
        const editor = editorRef.current;
        const isCursorVisible = editor ? isAceCursorRowVisible(editor) : false;

        setInteractionState({ isCursorRowVisible: isCursorVisible });

        if (editor) {
            applyRelativeLineNumbers(editor, isCursorVisible);
        }
    }

    return {
        editorHostRef,
        onBlur: handleBlur,
        onChange: handleChange,
        onCursorChange: handleCursorChange,
        onFocus: handleFocus,
        onLoad: handleLoad,
        onScroll: handleScroll,
    };
}
