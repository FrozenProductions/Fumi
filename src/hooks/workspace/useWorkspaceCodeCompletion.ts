import { useCallback, useEffect, useRef } from "react";
import type { LuauFileAnalysis } from "../../lib/luau/symbolScanner.type";
import {
    bindWorkspaceEditorShortcuts,
    isPassiveCompletionTrigger,
} from "../../lib/workspace/codeCompletion/ace";
import type {
    AceChangeDelta,
    AceEditorInstance,
} from "../../lib/workspace/codeCompletion/ace.type";
import type {
    UseWorkspaceCodeCompletionOptions,
    UseWorkspaceCodeCompletionResult,
} from "../../lib/workspace/codeCompletion/workspaceCodeCompletion.type";
import { useAppStore } from "../app/useAppStore";
import { useWorkspaceCompletionPopup } from "./codeCompletion/useWorkspaceCompletionPopup";
import { useWorkspaceEditorSearch } from "./editorSearch/useWorkspaceEditorSearch";

type StoredAceSessionState = {
    content: string;
    scrollLeft: number;
    scrollTop: number;
    selection: unknown;
    undoHistory: object;
};

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
    const clearGoToLineRequest = useAppStore(
        (state) => state.clearGoToLineRequest,
    );
    const goToLineRequest = useAppStore((state) => state.goToLineRequest);

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

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            const isSaveShortcut =
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === "s";

            if (!isSaveShortcut) {
                return;
            }

            event.preventDefault();
            void saveActiveWorkspaceTab();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [saveActiveWorkspaceTab]);

    useEffect(() => {
        if (!activeTabId) {
            closeCompletionPopup();
            return;
        }

        closeCompletionPopup();
        const animationFrameId = window.requestAnimationFrame(() => {
            const editor = getActiveEditor();

            if (!editor) {
                return;
            }

            editor.resize();
            editor.focus();
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [activeTabId, closeCompletionPopup, getActiveEditor]);

    useEffect(() => {
        if (!goToLineRequest || !activeTabId) {
            return;
        }

        if (goToLine(goToLineRequest.lineNumber)) {
            clearGoToLineRequest();
        }
    }, [activeTabId, clearGoToLineRequest, goToLine, goToLineRequest]);

    useEffect(() => {
        const openTabIds = new Set(tabs.map((tab) => tab.id));

        for (const tabId of editorByTabIdRef.current.keys()) {
            if (!openTabIds.has(tabId)) {
                editorByTabIdRef.current.delete(tabId);
            }
        }

        for (const tabId of sessionStateByTabIdRef.current.keys()) {
            if (!openTabIds.has(tabId)) {
                sessionStateByTabIdRef.current.delete(tabId);
            }
        }
    }, [tabs]);

    const createHandleEditorLoad = useCallback(
        (tabId: string) =>
            (editor: unknown): void => {
                const aceEditor = editor as AceEditorInstance;
                bindWorkspaceEditorShortcuts(aceEditor, toggleSearch);
                editorByTabIdRef.current.set(tabId, aceEditor);

                const tab = tabsByIdRef.current.get(tabId);

                if (!tab) {
                    return;
                }

                const session = aceEditor.getSession();
                const storedSessionState =
                    sessionStateByTabIdRef.current.get(tabId);

                if (
                    storedSessionState &&
                    storedSessionState.content === tab.content
                ) {
                    session
                        .getUndoManager()
                        .fromJSON(storedSessionState.undoHistory);
                    session.selection.fromJSON(storedSessionState.selection);
                    session.setScrollLeft(storedSessionState.scrollLeft);
                    session.setScrollTop(storedSessionState.scrollTop);
                } else {
                    sessionStateByTabIdRef.current.delete(tabId);
                }

                window.requestAnimationFrame(() => {
                    if (
                        !storedSessionState ||
                        storedSessionState.content !== tab.content
                    ) {
                        aceEditor.moveCursorTo(
                            tab.cursor.line,
                            tab.cursor.column,
                        );
                        aceEditor.clearSelection();
                        aceEditor.session.setScrollTop(tab.cursor.scrollTop);
                    }

                    if (activeTabIdRef.current === tabId) {
                        aceEditor.resize();
                        aceEditor.focus();
                        closeCompletionPopup();
                    }
                });
            },
        [closeCompletionPopup, toggleSearch],
    );

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

    const createHandleCursorChange = useCallback(
        (tabId: string) =>
            (_selection: unknown): void => {
                const editor = editorByTabIdRef.current.get(tabId);

                if (!editor || activeTabIdRef.current !== tabId) {
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
            },
        [
            closeCompletionPopup,
            completionPopup,
            updateActiveTabCursor,
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
        createHandleCursorChange,
        createHandleEditorChange,
        createHandleEditorLoad,
        createHandleEditorUnmount,
        createHandleScroll,
        acceptCompletion,
        goToLine,
    };
}
