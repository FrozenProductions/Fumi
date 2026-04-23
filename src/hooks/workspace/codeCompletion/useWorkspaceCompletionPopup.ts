import { useCallback, useEffect, useState } from "react";
import {
    getLuauCompletionQuery,
    shouldOpenLuauCompletion,
    shouldSuppressLuauCompletionForTokenType,
} from "../../../lib/luau/completion/completion";
import type { LuauCompletionPopupState } from "../../../lib/luau/luau.type";
import { isLuauEditorSession } from "../../../lib/workspace/codeCompletion/ace";
import type { UpdateWorkspaceCompletionPopupOptions } from "../../../lib/workspace/codeCompletion/workspaceCodeCompletion.type";
import type {
    UseWorkspaceCompletionPopupOptions,
    UseWorkspaceCompletionPopupResult,
} from "./useWorkspaceCompletionPopup.type";
import {
    getCompletionPopupPositionState,
    getSelectedCompletionIndex,
    isCompletionPopupInteractionTarget,
} from "./useWorkspaceCompletionPopupHelpers";
import { useWorkspaceCompletionPopupKeyboard } from "./useWorkspaceCompletionPopupKeyboard";

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

    const repositionCompletionPopup = useCallback((): void => {
        const editor = getActiveEditor();

        if (
            !editor ||
            !isIntellisenseEnabled ||
            !isLuauEditorSession(editor, activeEditorMode)
        ) {
            setCompletionPopup(null);
            return;
        }

        setCompletionPopup((currentPopup) => {
            if (!currentPopup) {
                return currentPopup;
            }

            const cursor = editor.getCursorPosition();

            return {
                ...currentPopup,
                position: getCompletionPopupPositionState({
                    cursor,
                    editor,
                    items: currentPopup.items,
                    intellisenseWidth,
                    previousPlacement: currentPopup.position.verticalPlacement,
                }),
                row: cursor.row,
            };
        });
    }, [
        activeEditorMode,
        getActiveEditor,
        intellisenseWidth,
        isIntellisenseEnabled,
    ]);

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
            const tokenType = editor.session.getTokenAt(
                cursor.row,
                Math.max(cursor.column - 1, 0),
            )?.type;

            if (shouldSuppressLuauCompletionForTokenType(tokenType)) {
                setCompletionPopup(null);
                return;
            }

            const beforeCursor = editor.session
                .getLine(cursor.row)
                .slice(0, cursor.column);
            const cursorIndex = editor.session.doc.positionToIndex(cursor);

            const query = getLuauCompletionQuery({
                analysis: getActiveLuauAnalysis(),
                beforeCursor,
                cursorIndex,
                priority: intellisensePriority,
            });
            const forceOpen = options?.forceOpen ?? isCompletionExplicit;

            if (!shouldOpenLuauCompletion(query, forceOpen)) {
                setCompletionPopup(null);
                return;
            }

            setCompletionPopup((currentPopup) => ({
                position: getCompletionPopupPositionState({
                    cursor,
                    editor,
                    items: query.items,
                    intellisenseWidth,
                    previousPlacement: currentPopup?.position.verticalPlacement,
                }),
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

    useWorkspaceCompletionPopupKeyboard({
        acceptCompletion,
        activeEditorMode,
        completionPopup,
        getActiveEditor,
        isIntellisenseEnabled,
        setCompletionPopup,
        suppressNextPassiveCompletionRef,
        updateCompletionPopup,
    });

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
        repositionCompletionPopup,
        updateCompletionPopup,
        acceptCompletion,
        handleCompletionHover,
    };
}
