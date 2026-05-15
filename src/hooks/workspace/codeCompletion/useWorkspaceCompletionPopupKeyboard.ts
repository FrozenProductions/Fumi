import { useEffect, useRef } from "react";
import {
    isDeletionKey,
    isManualCompletionShortcut,
    isNavigationKey,
} from "../../../lib/workspace/codeCompletion/keyboard";
import { shiftCompletionSelection } from "./useWorkspaceCompletionPopupHelpers";
import type { WorkspaceCompletionPopupKeyboardOptions } from "./useWorkspaceCompletionPopupKeyboard.type";

/**
 * Handles keyboard interactions with the Luau completion popup.
 *
 * @remarks
 * Registers a capture-phase `keydown` listener. Arrow keys navigate the popup,
 * Enter/Tab accept, Escape dismisses. Deletion and navigation keys close the
 * popup and suppress the next passive completion trigger. Manual completion
 * shortcut (`Ctrl+Space`) forces a fresh completion request.
 *
 * @param options - Completion popup state, editor accessor, and action callbacks
 * @returns void (side-effect only)
 */
export function useWorkspaceCompletionPopupKeyboard({
    acceptCompletion,
    activeEditorMode,
    completionPopup,
    getActiveEditor,
    isIntellisenseEnabled,
    setCompletionPopup,
    suppressNextPassiveCompletionRef,
    updateCompletionPopup,
}: WorkspaceCompletionPopupKeyboardOptions): void {
    const handleKeyDownRef = useRef<((event: KeyboardEvent) => void) | null>(
        null,
    );

    handleKeyDownRef.current = (event: KeyboardEvent): void => {
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

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            handleKeyDownRef.current?.(event);
        };

        window.addEventListener("keydown", handleKeyDown, true);
        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, []);
}
