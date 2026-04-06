import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "../app/useAppStore";
import {
    bindWorkspaceEditorShortcuts,
    isPassiveCompletionTrigger,
} from "./codeCompletion/ace";
import type {
    AceChangeDelta,
    AceEditorInstance,
} from "./codeCompletion/ace.type";
import { useWorkspaceCompletionPopup } from "./codeCompletion/useWorkspaceCompletionPopup";
import type {
    UseWorkspaceCodeCompletionOptions,
    UseWorkspaceCodeCompletionResult,
} from "./codeCompletion/workspaceCodeCompletion.type";
import { useWorkspaceEditorSearch } from "./useWorkspaceEditorSearch";

export function useWorkspaceCodeCompletion({
    activeEditorMode,
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
    const suppressNextPassiveCompletionRef = useRef(false);
    const activeTabIdRef = useRef<string | null>(activeTabId);
    const tabsByIdRef = useRef(
        new Map(tabs.map((tab) => [tab.id, tab] as const)),
    );
    const clearGoToLineRequest = useAppStore(
        (state) => state.clearGoToLineRequest,
    );
    const goToLineRequest = useAppStore((state) => state.goToLineRequest);

    activeTabIdRef.current = activeTabId;
    tabsByIdRef.current = new Map(tabs.map((tab) => [tab.id, tab] as const));

    const getActiveEditor = useCallback((): AceEditorInstance | null => {
        if (!activeTabIdRef.current) {
            return null;
        }

        return editorByTabIdRef.current.get(activeTabIdRef.current) ?? null;
    }, []);

    const {
        acceptCompletion,
        closeCompletionPopup,
        completionPopup,
        handleCompletionHover,
        updateCompletionPopup,
    } = useWorkspaceCompletionPopup({
        activeEditorMode,
        getActiveEditor,
        isIntellisenseEnabled,
        intellisensePriority,
        intellisenseWidth,
        suppressNextPassiveCompletionRef,
    });
    const { openSearch, searchPanel } = useWorkspaceEditorSearch({
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
    }, [tabs]);

    const createHandleEditorLoad = useCallback(
        (tabId: string) =>
            (editor: unknown): void => {
                const aceEditor = editor as AceEditorInstance;
                bindWorkspaceEditorShortcuts(aceEditor, openSearch);
                editorByTabIdRef.current.set(tabId, aceEditor);

                const tab = tabsByIdRef.current.get(tabId);

                if (!tab) {
                    return;
                }

                window.requestAnimationFrame(() => {
                    aceEditor.moveCursorTo(tab.cursor.line, tab.cursor.column);
                    aceEditor.clearSelection();
                    aceEditor.session.setScrollTop(tab.cursor.scrollTop);

                    if (activeTabIdRef.current === tabId) {
                        aceEditor.resize();
                        aceEditor.focus();
                        closeCompletionPopup();
                    }
                });
            },
        [closeCompletionPopup, openSearch],
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

                updateCompletionPopup({
                    forceOpen: completionPopup.explicit,
                    preserveSelection: true,
                });
            },
        [completionPopup, updateActiveTabScrollTop, updateCompletionPopup],
    );

    return {
        completionPopup,
        searchPanel,
        handleCompletionHover,
        createHandleCursorChange,
        createHandleEditorChange,
        createHandleEditorLoad,
        createHandleScroll,
        acceptCompletion,
    };
}
