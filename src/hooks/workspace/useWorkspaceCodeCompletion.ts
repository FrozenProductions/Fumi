import { useCallback, useEffect, useRef } from "react";
import { WORKSPACE_EDITOR_CONTENT_SYNC_DELAY_MS } from "../../constants/workspace/editor";
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
import {
    clearLiveWorkspaceEditorContent,
    getLiveWorkspaceEditorContent,
    setLiveWorkspaceEditorContent,
} from "../../lib/workspace/editor/liveWorkspaceEditorContent";
import { useWorkspaceCodeCompletionLifecycle } from "./codeCompletion/useWorkspaceCodeCompletionLifecycle";
import type {
    AceEditorDestroyEventTarget,
    StoredAceSessionState,
} from "./codeCompletion/useWorkspaceCodeCompletionLifecycle.type";
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
    updateWorkspaceTabContent,
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
    const cursorUpdateAnimationFrameIdRef = useRef<number | null>(null);
    const scrollUpdateAnimationFrameIdRef = useRef<number | null>(null);
    const contentUpdateTimeoutIdRef = useRef<number | null>(null);
    const pendingContentUpdateRef = useRef<{
        content: string;
        tabId: string;
    } | null>(null);
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
    const cancelCursorUpdate = useCallback((): void => {
        if (cursorUpdateAnimationFrameIdRef.current === null) {
            return;
        }

        window.cancelAnimationFrame(cursorUpdateAnimationFrameIdRef.current);
        cursorUpdateAnimationFrameIdRef.current = null;
    }, []);
    const cancelScrollUpdate = useCallback((): void => {
        if (scrollUpdateAnimationFrameIdRef.current === null) {
            return;
        }

        window.cancelAnimationFrame(scrollUpdateAnimationFrameIdRef.current);
        scrollUpdateAnimationFrameIdRef.current = null;
    }, []);
    const cancelContentUpdate = useCallback((): void => {
        if (contentUpdateTimeoutIdRef.current === null) {
            return;
        }

        window.clearTimeout(contentUpdateTimeoutIdRef.current);
        contentUpdateTimeoutIdRef.current = null;
    }, []);
    const flushPendingContentToStore = useCallback((): void => {
        cancelContentUpdate();

        const pendingContentUpdate = pendingContentUpdateRef.current;

        if (!pendingContentUpdate) {
            return;
        }

        pendingContentUpdateRef.current = null;
        if (
            getLiveWorkspaceEditorContent(pendingContentUpdate.tabId) !==
            pendingContentUpdate.content
        ) {
            return;
        }

        updateWorkspaceTabContent(
            pendingContentUpdate.tabId,
            pendingContentUpdate.content,
        );
        clearLiveWorkspaceEditorContent(pendingContentUpdate.tabId);
    }, [cancelContentUpdate, updateWorkspaceTabContent]);
    const scheduleContentUpdate = useCallback(
        (tabId: string, content: string): void => {
            setLiveWorkspaceEditorContent(tabId, content);
            pendingContentUpdateRef.current = { content, tabId };
            cancelContentUpdate();
            contentUpdateTimeoutIdRef.current = window.setTimeout(() => {
                flushPendingContentToStore();
            }, WORKSPACE_EDITOR_CONTENT_SYNC_DELAY_MS);
        },
        [cancelContentUpdate, flushPendingContentToStore],
    );
    const flushActiveCursorToStore = useCallback((): void => {
        cancelCursorUpdate();

        const activeTabIdValue = activeTabIdRef.current;

        if (!activeTabIdValue) {
            return;
        }

        const editor = editorByTabIdRef.current.get(activeTabIdValue);

        if (!editor) {
            return;
        }

        const cursor = editor.getCursorPosition();

        updateActiveTabCursor({
            line: cursor.row,
            column: cursor.column,
            scrollTop: editor.session.getScrollTop(),
        });
    }, [cancelCursorUpdate, updateActiveTabCursor]);
    const scheduleCursorUpdate = useCallback(
        (tabId: string): void => {
            if (cursorUpdateAnimationFrameIdRef.current !== null) {
                return;
            }

            cursorUpdateAnimationFrameIdRef.current =
                window.requestAnimationFrame(() => {
                    cursorUpdateAnimationFrameIdRef.current = null;

                    if (activeTabIdRef.current !== tabId) {
                        return;
                    }

                    const editor = editorByTabIdRef.current.get(tabId);

                    if (!editor) {
                        return;
                    }

                    const cursor = editor.getCursorPosition();

                    updateActiveTabCursor({
                        line: cursor.row,
                        column: cursor.column,
                        scrollTop: editor.session.getScrollTop(),
                    });
                });
        },
        [updateActiveTabCursor],
    );
    const scheduleScrollUpdate = useCallback(
        (tabId: string): void => {
            if (scrollUpdateAnimationFrameIdRef.current !== null) {
                return;
            }

            scrollUpdateAnimationFrameIdRef.current =
                window.requestAnimationFrame(() => {
                    scrollUpdateAnimationFrameIdRef.current = null;

                    if (activeTabIdRef.current !== tabId) {
                        return;
                    }

                    const editor = editorByTabIdRef.current.get(tabId);

                    if (!editor) {
                        return;
                    }

                    updateActiveTabScrollTop(editor.session.getScrollTop());
                });
        },
        [updateActiveTabScrollTop],
    );
    const saveActiveWorkspaceTabWithCursor =
        useCallback(async (): Promise<void> => {
            flushPendingContentToStore();
            flushActiveCursorToStore();
            await saveActiveWorkspaceTab();
        }, [
            flushActiveCursorToStore,
            flushPendingContentToStore,
            saveActiveWorkspaceTab,
        ]);

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
        saveActiveWorkspaceTab: saveActiveWorkspaceTabWithCursor,
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

        scheduleCursorUpdate(tabId);

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
            clearLiveWorkspaceEditorContent(tabId);

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

                scheduleContentUpdate(tabId, value);

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
            updateCompletionPopup,
            scheduleContentUpdate,
        ],
    );

    const createHandleScroll = useCallback(
        (tabId: string) =>
            (_editor: unknown): void => {
                const editor = editorByTabIdRef.current.get(tabId);

                if (!editor || activeTabIdRef.current !== tabId) {
                    return;
                }

                scheduleScrollUpdate(tabId);

                if (!completionPopup) {
                    return;
                }

                repositionCompletionPopup();
            },
        [completionPopup, repositionCompletionPopup, scheduleScrollUpdate],
    );

    useEffect(() => {
        return () => {
            flushPendingContentToStore();
            cancelCursorUpdate();
            cancelScrollUpdate();
        };
    }, [cancelCursorUpdate, cancelScrollUpdate, flushPendingContentToStore]);

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
