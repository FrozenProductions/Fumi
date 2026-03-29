import { useCallback, useEffect, useRef, useState } from "react";
import {
    getLuauCompletionQuery,
    shouldOpenLuauCompletion,
} from "../../lib/luau/completion";
import { getLuauCompletionPopupPosition } from "../../lib/luau/completionPopup";
import type { AppIntellisensePriority } from "../../types/app/settings";
import type { LuauCompletionPopupState } from "../../types/luau/editor";
import type { WorkspaceTab } from "../../types/workspace/session";
import type { WorkspaceCursorState } from "../../types/workspace/workspace";
import { useAppStore } from "../app/useAppStore";
import {
    type AceChangeDelta,
    type AceEditorInstance,
    type AceRendererInstance,
    bindWorkspaceEditorShortcuts,
    isLuauEditorSession,
    isPassiveCompletionTrigger,
} from "./codeCompletion/ace";
import {
    isDeletionKey,
    isManualCompletionShortcut,
    isNavigationKey,
} from "./codeCompletion/keyboard";

type UseWorkspaceCodeCompletionOptions = {
    activeEditorMode: string;
    activeTab: WorkspaceTab | null;
    isIntellisenseEnabled: boolean;
    intellisensePriority: AppIntellisensePriority;
    saveActiveWorkspaceTab: () => Promise<void>;
    updateActiveTabContent: (content: string) => void;
    updateActiveTabCursor: (cursor: WorkspaceCursorState) => void;
    updateActiveTabScrollTop: (scrollTop: number) => void;
};

export type UseWorkspaceCodeCompletionResult = {
    completionPopup: LuauCompletionPopupState | null;
    handleCompletionHover: (index: number) => void;
    handleCursorChange: (selection: unknown) => void;
    handleEditorChange: (value: string, delta?: AceChangeDelta) => void;
    handleEditorLoad: (editor: unknown) => void;
    handleScroll: (editor: unknown) => void;
    acceptCompletion: (completionIndex: number) => void;
};

export function useWorkspaceCodeCompletion({
    activeEditorMode,
    activeTab,
    isIntellisenseEnabled,
    intellisensePriority,
    saveActiveWorkspaceTab,
    updateActiveTabContent,
    updateActiveTabCursor,
    updateActiveTabScrollTop,
}: UseWorkspaceCodeCompletionOptions): UseWorkspaceCodeCompletionResult {
    const editorRef = useRef<AceEditorInstance | null>(null);
    const restoredTabIdRef = useRef<string | null>(null);
    const suppressNextPassiveCompletionRef = useRef(false);
    const clearGoToLineRequest = useAppStore(
        (state) => state.clearGoToLineRequest,
    );
    const goToLineRequest = useAppStore((state) => state.goToLineRequest);
    const [editorLoadVersion, setEditorLoadVersion] = useState(0);
    const [completionPopup, setCompletionPopup] =
        useState<LuauCompletionPopupState | null>(null);
    const tabRestoreStateRef = useRef<WorkspaceCursorState>({
        line: activeTab?.cursor.line ?? 0,
        column: activeTab?.cursor.column ?? 0,
        scrollTop: activeTab?.cursor.scrollTop ?? 0,
    });
    const activeTabId = activeTab?.id ?? null;

    tabRestoreStateRef.current = {
        line: activeTab?.cursor.line ?? 0,
        column: activeTab?.cursor.column ?? 0,
        scrollTop: activeTab?.cursor.scrollTop ?? 0,
    };

    const closeCompletionPopup = useCallback((): void => {
        setCompletionPopup(null);
    }, []);

    const goToLine = useCallback(
        (lineNumber: number): boolean => {
            const editor = editorRef.current;

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
        [closeCompletionPopup],
    );

    const updateCompletionPopup = useCallback(
        (options?: {
            forceOpen?: boolean;
            preserveSelection?: boolean;
        }): void => {
            const editor = editorRef.current;

            if (
                !editor ||
                !isIntellisenseEnabled ||
                !isLuauEditorSession(editor, activeEditorMode)
            ) {
                setCompletionPopup(null);
                return;
            }

            const cursor = editor.getCursorPosition();
            const line = editor.session.getLine(cursor.row);
            const query = getLuauCompletionQuery(
                line,
                cursor.column,
                intellisensePriority,
            );
            const forceOpen =
                options?.forceOpen ?? completionPopup?.explicit ?? false;

            if (!shouldOpenLuauCompletion(query, forceOpen)) {
                setCompletionPopup(null);
                return;
            }

            const renderer = editor.renderer as AceRendererInstance;
            const caret = renderer.$cursorLayer.getPixelPosition(cursor, true);
            const editorBounds = editor.container.getBoundingClientRect();
            setCompletionPopup((currentPopup) => {
                const selectedLabel =
                    options?.preserveSelection && currentPopup
                        ? currentPopup.items[currentPopup.selectedIndex]?.label
                        : null;
                const selectedIndex =
                    selectedLabel === null
                        ? 0
                        : Math.max(
                              0,
                              query.items.findIndex(
                                  (item) => item.label === selectedLabel,
                              ),
                          );

                return {
                    explicit: forceOpen,
                    items: query.items,
                    position: getLuauCompletionPopupPosition(
                        editorBounds.left + caret.left,
                        editorBounds.top + caret.top,
                        query.items,
                    ),
                    replaceStartColumn: query.replaceStartColumn,
                    replaceEndColumn: query.replaceEndColumn,
                    row: cursor.row,
                    selectedIndex,
                };
            });
        },
        [
            activeEditorMode,
            completionPopup,
            intellisensePriority,
            isIntellisenseEnabled,
        ],
    );

    const acceptCompletion = useCallback(
        (completionIndex: number): void => {
            const editor = editorRef.current;
            const selectedItem = completionPopup?.items[completionIndex];

            if (!editor || !completionPopup || !selectedItem) {
                return;
            }

            editor.session.doc.removeInLine(
                completionPopup.row,
                completionPopup.replaceStartColumn,
                completionPopup.replaceEndColumn,
            );
            editor.moveCursorTo(
                completionPopup.row,
                completionPopup.replaceStartColumn,
            );
            editor.insert(selectedItem.insertText ?? selectedItem.label);
            editor.focus();
            setCompletionPopup(null);
        },
        [completionPopup],
    );

    useEffect(() => {
        if (!completionPopup) {
            return;
        }

        const handleDismiss = (event: MouseEvent): void => {
            if (
                event.target instanceof Element &&
                event.target.closest("[data-code-completion-popup='true']")
            ) {
                return;
            }

            if (editorRef.current?.container.contains(event.target as Node)) {
                return;
            }

            setCompletionPopup(null);
        };

        document.addEventListener("mousedown", handleDismiss);

        return () => {
            document.removeEventListener("mousedown", handleDismiss);
        };
    }, [completionPopup]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            const editor = editorRef.current;

            if (!editor?.isFocused()) {
                return;
            }

            if (isDeletionKey(event.key) || isNavigationKey(event.key)) {
                suppressNextPassiveCompletionRef.current = true;

                if (
                    isDeletionKey(event.key) ||
                    event.key === "ArrowLeft" ||
                    event.key === "ArrowRight" ||
                    event.key === "Home" ||
                    event.key === "End" ||
                    event.key === "PageUp" ||
                    event.key === "PageDown" ||
                    !completionPopup
                ) {
                    setCompletionPopup(null);
                }
            }

            if (
                isManualCompletionShortcut(event) &&
                isIntellisenseEnabled &&
                activeEditorMode === "luau"
            ) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                updateCompletionPopup({ forceOpen: true });
                return;
            }

            if (!completionPopup) {
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                setCompletionPopup((currentPopup) =>
                    currentPopup
                        ? {
                              ...currentPopup,
                              selectedIndex:
                                  (currentPopup.selectedIndex + 1) %
                                  currentPopup.items.length,
                          }
                        : currentPopup,
                );
                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                setCompletionPopup((currentPopup) =>
                    currentPopup
                        ? {
                              ...currentPopup,
                              selectedIndex:
                                  (currentPopup.selectedIndex -
                                      1 +
                                      currentPopup.items.length) %
                                  currentPopup.items.length,
                          }
                        : currentPopup,
                );
                return;
            }

            if (event.key === "Enter" || event.key === "Tab") {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                acceptCompletion(completionPopup.selectedIndex);
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                setCompletionPopup(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [
        acceptCompletion,
        activeEditorMode,
        completionPopup,
        isIntellisenseEnabled,
        updateCompletionPopup,
    ]);

    useEffect(() => {
        if (activeEditorMode !== "luau" || !isIntellisenseEnabled) {
            setCompletionPopup(null);
        }
    }, [activeEditorMode, isIntellisenseEnabled]);

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
        const editor = editorRef.current;

        if (!editor || !activeTabId || editorLoadVersion < 1) {
            restoredTabIdRef.current = null;
            return;
        }

        if (restoredTabIdRef.current === activeTabId) {
            return;
        }

        const restoreState = tabRestoreStateRef.current;
        const animationFrameId = window.requestAnimationFrame(() => {
            const activeEditor = editorRef.current;

            if (!activeEditor || restoredTabIdRef.current === activeTabId) {
                return;
            }

            activeEditor.moveCursorTo(restoreState.line, restoreState.column);
            activeEditor.clearSelection();
            activeEditor.session.setScrollTop(restoreState.scrollTop);
            activeEditor.focus();
            restoredTabIdRef.current = activeTabId;
            updateCompletionPopup({ preserveSelection: true });
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [activeTabId, editorLoadVersion, updateCompletionPopup]);

    useEffect(() => {
        if (editorLoadVersion < 1 || !goToLineRequest || !activeTabId) {
            return;
        }

        if (goToLine(goToLineRequest.lineNumber)) {
            clearGoToLineRequest();
        }
    }, [
        activeTabId,
        clearGoToLineRequest,
        editorLoadVersion,
        goToLine,
        goToLineRequest,
    ]);

    const handleEditorLoad = useCallback(
        (editor: unknown): void => {
            const aceEditor = editor as AceEditorInstance;
            bindWorkspaceEditorShortcuts(aceEditor);
            editorRef.current = aceEditor;
            restoredTabIdRef.current = null;
            setEditorLoadVersion((currentVersion) => currentVersion + 1);
            closeCompletionPopup();
        },
        [closeCompletionPopup],
    );

    const handleEditorChange = useCallback(
        (value: string, delta?: AceChangeDelta): void => {
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

    const handleCursorChange = useCallback(
        (_selection: unknown): void => {
            const editor = editorRef.current;

            if (
                !editor ||
                !activeTabId ||
                restoredTabIdRef.current !== activeTabId
            ) {
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
            activeTabId,
            closeCompletionPopup,
            completionPopup,
            updateActiveTabCursor,
            updateCompletionPopup,
        ],
    );

    const handleScroll = useCallback(
        (_editor: unknown): void => {
            const editor = editorRef.current;

            if (
                !editor ||
                !activeTabId ||
                restoredTabIdRef.current !== activeTabId
            ) {
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
        [
            activeTabId,
            completionPopup,
            updateActiveTabScrollTop,
            updateCompletionPopup,
        ],
    );

    const handleCompletionHover = useCallback((index: number): void => {
        setCompletionPopup((currentPopup) =>
            currentPopup
                ? {
                      ...currentPopup,
                      selectedIndex: index,
                  }
                : currentPopup,
        );
    }, []);

    return {
        completionPopup,
        handleCompletionHover,
        handleCursorChange,
        handleEditorChange,
        handleEditorLoad,
        handleScroll,
        acceptCompletion,
    };
}
