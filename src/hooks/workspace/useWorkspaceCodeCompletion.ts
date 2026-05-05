import { useCallback, useRef } from "react";
import type { LuauFileAnalysis } from "../../lib/luau/symbolScanner/symbolScanner.type";
import { isPassiveCompletionTrigger } from "../../lib/workspace/codeCompletion/ace";
import type {
    AceChangeDelta,
    AceEditorInstance,
} from "../../lib/workspace/codeCompletion/ace.type";
import type {
    UseWorkspaceCodeCompletionOptions,
    UseWorkspaceCodeCompletionResult,
} from "../../lib/workspace/codeCompletion/workspaceCodeCompletion.type";
import type {
    AceEditorDestroyEventTarget,
    StoredAceSessionState,
} from "./codeCompletion/useWorkspaceCodeCompletionLifecycle";
import { useWorkspaceCodeCompletionLifecycle } from "./codeCompletion/useWorkspaceCodeCompletionLifecycle";
import { useWorkspaceCompletionPopup } from "./codeCompletion/useWorkspaceCompletionPopup";
import { useWorkspaceEditorLoadHandler } from "./codeCompletion/useWorkspaceEditorLoadHandler";
import { useWorkspaceEditorSearch } from "./editorSearch/useWorkspaceEditorSearch";

/**
 * Orchestrates Ace editor code completion, search, and cursor go-to functionality.
 *
 * @remarks
 * Manages editor instance lifecycle per tab, coordinates the completion popup and
 * search panel, handles save shortcuts, cursor tracking, and go-to-line requests
 * from the app store. Integrates with Luau analysis for intellisense.
 */
export function useWorkspaceCodeCompletion({
    activeEditorMode,
    activeLuauAnalysis,
    activeTabId,
    tabs,
    isIntellisenseEnabled,
    intellisensePriority,
    intellisenseWidth,
    saveActiveWorkspaceTab,
    updateActiveTabContent,
    updateActiveTabCursor,
    updateActiveTabScrollTop,
}: UseWorkspaceCodeCompletionOptions): UseWorkspaceCodeCompletionResult {
    const editorByTabIdRef = useRef(new Map<string, AceEditorInstance>());
    const cursorListenerCleanupByTabIdRef = useRef(
        new Map<string, () => void>(),
    );
    const sessionStateByTabIdRef = useRef(
        new Map<string, StoredAceSessionState>(),
    );
    const suppressNextPassiveCompletionRef = useRef(false);
    const activeTabIdRef = useRef<string | null>(activeTabId);
    const activeLuauAnalysisRef = useRef<LuauFileAnalysis | null>(
        activeLuauAnalysis,
    );
    const tabsByIdRef = useRef(
        new Map(tabs.map((tab) => [tab.id, tab] as const)),
    );
    activeTabIdRef.current = activeTabId;
    activeLuauAnalysisRef.current = activeLuauAnalysis;
    tabsByIdRef.current = new Map(tabs.map((tab) => [tab.id, tab] as const));

    const getActiveEditor = useCallback((): AceEditorInstance | null => {
        if (!activeTabIdRef.current) {
            return null;
        }

        return editorByTabIdRef.current.get(activeTabIdRef.current) ?? null;
    }, []);
    const getActiveLuauAnalysis = useCallback(
        (): LuauFileAnalysis | null => activeLuauAnalysisRef.current,
        [],
    );

    const {
        acceptCompletion,
        closeCompletionPopup,
        completionPopup,
        handleCompletionHover,
        repositionCompletionPopup,
        updateCompletionPopup,
    } = useWorkspaceCompletionPopup({
        activeEditorMode,
        getActiveEditor,
        getActiveLuauAnalysis,
        isIntellisenseEnabled,
        intellisensePriority,
        intellisenseWidth,
        suppressNextPassiveCompletionRef,
    });
    const { toggleSearch, searchPanel } = useWorkspaceEditorSearch({
        activeTabId,
        tabs,
        getActiveEditor,
        closeCompletionPopup,
    });

    const goToLine = useCallback(
        (lineNumber: number): boolean => {
            const editor = getActiveEditor();

            if (!editor || !Number.isInteger(lineNumber) || lineNumber < 1) {
                return false;
            }

            const lastLineNumber = Math.max(editor.session.getLength(), 1);
            const targetLineNumber = Math.min(lineNumber, lastLineNumber);

            editor.gotoLine(targetLineNumber, 0, true);
            editor.clearSelection();
            editor.focus();
            closeCompletionPopup();
            return true;
        },
        [closeCompletionPopup, getActiveEditor],
    );

    useWorkspaceCodeCompletionLifecycle({
        activeTabId,
        closeCompletionPopup,
        cursorListenerCleanupByTabIdRef,
        editorByTabIdRef,
        getActiveEditor,
        goToLine,
        saveActiveWorkspaceTab,
        sessionStateByTabIdRef,
        tabs,
    });

    const handleEditorCursorChangeRef = useRef<(tabId: string) => void>(
        () => {},
    );

    handleEditorCursorChangeRef.current = (tabId: string): void => {
        const editor = editorByTabIdRef.current.get(tabId) as
            | AceEditorDestroyEventTarget
            | undefined;

        if (!editor || editor.destroyed || activeTabIdRef.current !== tabId) {
            return;
        }

        const cursor = editor.getCursorPosition();
        updateActiveTabCursor({
            line: cursor.row,
            column: cursor.column,
            scrollTop: editor.session.getScrollTop(),
        });

        if (suppressNextPassiveCompletionRef.current) {
            suppressNextPassiveCompletionRef.current = false;
            closeCompletionPopup();
            return;
        }

        if (!completionPopup) {
            return;
        }

        updateCompletionPopup({
            forceOpen: completionPopup.explicit,
            preserveSelection: true,
        });
    };

    const createHandleEditorLoad = useWorkspaceEditorLoadHandler({
        activeTabIdRef,
        closeCompletionPopup,
        cursorListenerCleanupByTabIdRef,
        editorByTabIdRef,
        handleEditorCursorChangeRef,
        sessionStateByTabIdRef,
        tabsByIdRef,
        toggleSearch,
    });

    const createHandleEditorUnmount = useCallback(
        (tabId: string) => (): void => {
            const editor = editorByTabIdRef.current.get(tabId);

            if (editor) {
                const session = editor.getSession();

                sessionStateByTabIdRef.current.set(tabId, {
                    content: editor.getValue(),
                    scrollLeft: session.getScrollLeft(),
                    scrollTop: session.getScrollTop(),
                    selection: session.selection.toJSON(),
                    undoHistory: session.getUndoManager().toJSON(),
                });
            }

            cursorListenerCleanupByTabIdRef.current.get(tabId)?.();
            cursorListenerCleanupByTabIdRef.current.delete(tabId);
            editorByTabIdRef.current.delete(tabId);

            if (activeTabIdRef.current === tabId) {
                closeCompletionPopup();
            }
        },
        [closeCompletionPopup],
    );

    const createHandleEditorChange = useCallback(
        (tabId: string) =>
            (value: string, delta?: AceChangeDelta): void => {
                if (activeTabIdRef.current !== tabId) {
                    return;
                }

                updateActiveTabContent(value);

                if (!isIntellisenseEnabled) {
                    closeCompletionPopup();
                    return;
                }

                if (delta?.action !== "insert") {
                    suppressNextPassiveCompletionRef.current = true;
                    closeCompletionPopup();
                    return;
                }

                const insertedText = delta.lines?.join("\n") ?? "";

                if (!isPassiveCompletionTrigger(insertedText)) {
                    closeCompletionPopup();
                    return;
                }

                suppressNextPassiveCompletionRef.current = false;
                window.requestAnimationFrame(() => {
                    updateCompletionPopup({ preserveSelection: true });
                });
            },
        [
            closeCompletionPopup,
            isIntellisenseEnabled,
            updateActiveTabContent,
            updateCompletionPopup,
        ],
    );

    const createHandleScroll = useCallback(
        (tabId: string) =>
            (_editor: unknown): void => {
                const editor = editorByTabIdRef.current.get(tabId);

                if (!editor || activeTabIdRef.current !== tabId) {
                    return;
                }

                updateActiveTabScrollTop(editor.session.getScrollTop());

                if (!completionPopup) {
                    return;
                }

                repositionCompletionPopup();
            },
        [completionPopup, repositionCompletionPopup, updateActiveTabScrollTop],
    );

    return {
        completionPopup,
        searchPanel,
        handleCompletionHover,
        createHandleEditorChange,
        createHandleEditorLoad,
        createHandleEditorUnmount,
        createHandleScroll,
        acceptCompletion,
        goToLine,
    };
}
