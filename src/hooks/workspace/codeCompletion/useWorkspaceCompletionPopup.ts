import { useCallback, useEffect, useState } from "react";
import {
    getLuauCompletionQuery,
    shouldOpenLuauCompletion,
} from "../../../lib/luau/completion";
import { getLuauCompletionPopupPosition } from "../../../lib/luau/completionPopup";
import type {
    LuauCompletionItem,
    LuauCompletionPopupState,
} from "../../../lib/luau/luau.type";
import { isLuauEditorSession } from "./ace";
import type { AceRendererInstance } from "./ace.type";
import {
    isDeletionKey,
    isManualCompletionShortcut,
    isNavigationKey,
} from "./keyboard";
import type {
    UseWorkspaceCompletionPopupOptions,
    UseWorkspaceCompletionPopupResult,
} from "./useWorkspaceCompletionPopup.type";
import type { UpdateWorkspaceCompletionPopupOptions } from "./workspaceCodeCompletion.type";

function isCompletionPopupInteractionTarget(
    target: EventTarget | null,
): boolean {
    return (
        target instanceof Element &&
        target.closest("[data-code-completion-popup='true']") !== null
    );
}

function getSelectedCompletionIndex(options: {
    currentPopup: LuauCompletionPopupState | null;
    items: LuauCompletionItem[];
    preserveSelection?: boolean;
}): number {
    const { currentPopup, items, preserveSelection } = options;
    const selectedLabel =
        preserveSelection && currentPopup
            ? currentPopup.items[currentPopup.selectedIndex]?.label
            : null;

    if (selectedLabel === null) {
        return 0;
    }

    return Math.max(
        0,
        items.findIndex((item) => item.label === selectedLabel),
    );
}

function shiftCompletionSelection(
    currentPopup: LuauCompletionPopupState | null,
    offset: number,
): LuauCompletionPopupState | null {
    if (!currentPopup) {
        return currentPopup;
    }

    return {
        ...currentPopup,
        selectedIndex:
            (currentPopup.selectedIndex + offset + currentPopup.items.length) %
            currentPopup.items.length,
    };
}

/**
 * Manages Luau code completion popup lifecycle, positioning, and keyboard interaction.
 *
 * @remarks
 * Handles completion popup opening based on cursor position and analysis,
 * keyboard navigation (arrow keys, enter, tab, escape), and auto-closing
 * on editor dismiss or navigation away from completion triggers.
 */
export function useWorkspaceCompletionPopup({
    activeEditorMode,
    getActiveEditor,
    getActiveLuauAnalysis,
    isIntellisenseEnabled,
    intellisensePriority,
    intellisenseWidth,
    suppressNextPassiveCompletionRef,
}: UseWorkspaceCompletionPopupOptions): UseWorkspaceCompletionPopupResult {
    const [completionPopup, setCompletionPopup] =
        useState<LuauCompletionPopupState | null>(null);
    const isCompletionExplicit = completionPopup?.explicit ?? false;

    const closeCompletionPopup = useCallback((): void => {
        setCompletionPopup(null);
    }, []);

    const updateCompletionPopup = useCallback(
        (options?: UpdateWorkspaceCompletionPopupOptions): void => {
            const editor = getActiveEditor();

            if (
                !editor ||
                !isIntellisenseEnabled ||
                !isLuauEditorSession(editor, activeEditorMode)
            ) {
                setCompletionPopup(null);
                return;
            }

            const cursor = editor.getCursorPosition();
            const query = getLuauCompletionQuery({
                analysis: getActiveLuauAnalysis(),
                content: editor.getValue(),
                row: cursor.row,
                column: cursor.column,
                priority: intellisensePriority,
            });
            const forceOpen = options?.forceOpen ?? isCompletionExplicit;

            if (!shouldOpenLuauCompletion(query, forceOpen)) {
                setCompletionPopup(null);
                return;
            }

            const renderer = editor.renderer as AceRendererInstance;
            const caret = renderer.$cursorLayer.getPixelPosition(cursor, true);
            const editorBounds = editor.container.getBoundingClientRect();
            setCompletionPopup((currentPopup) => ({
                position: getLuauCompletionPopupPosition(
                    editorBounds.left + caret.left,
                    editorBounds.top + caret.top,
                    query.items,
                    intellisenseWidth,
                    currentPopup?.position.verticalPlacement,
                ),
                explicit: forceOpen,
                items: query.items,
                replaceStartColumn: query.replaceStartColumn,
                replaceEndColumn: query.replaceEndColumn,
                row: cursor.row,
                selectedIndex: getSelectedCompletionIndex({
                    currentPopup,
                    items: query.items,
                    preserveSelection: options?.preserveSelection,
                }),
            }));
        },
        [
            activeEditorMode,
            getActiveEditor,
            getActiveLuauAnalysis,
            intellisensePriority,
            intellisenseWidth,
            isCompletionExplicit,
            isIntellisenseEnabled,
        ],
    );

    const acceptCompletion = useCallback(
        (completionIndex: number): void => {
            const editor = getActiveEditor();
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
        [completionPopup, getActiveEditor],
    );

    useEffect(() => {
        if (!completionPopup) {
            return;
        }

        const handleDismiss = (event: MouseEvent): void => {
            if (isCompletionPopupInteractionTarget(event.target)) {
                return;
            }

            if (getActiveEditor()?.container.contains(event.target as Node)) {
                return;
            }

            setCompletionPopup(null);
        };

        document.addEventListener("mousedown", handleDismiss);

        return () => {
            document.removeEventListener("mousedown", handleDismiss);
        };
    }, [completionPopup, getActiveEditor]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            const editor = getActiveEditor();

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
                    shiftCompletionSelection(currentPopup, 1),
                );
                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                setCompletionPopup((currentPopup) =>
                    shiftCompletionSelection(currentPopup, -1),
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
        getActiveEditor,
        isIntellisenseEnabled,
        suppressNextPassiveCompletionRef,
        updateCompletionPopup,
    ]);

    useEffect(() => {
        if (activeEditorMode !== "luau" || !isIntellisenseEnabled) {
            setCompletionPopup(null);
        }
    }, [activeEditorMode, isIntellisenseEnabled]);

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
        closeCompletionPopup,
        updateCompletionPopup,
        acceptCompletion,
        handleCompletionHover,
    };
}
