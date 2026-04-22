import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useEffect } from "react";
import type { LuauCompletionPopupState } from "../../../lib/luau/luau.type";
import type { AceEditorInstance } from "../../../lib/workspace/codeCompletion/ace.type";
import {
    isDeletionKey,
    isManualCompletionShortcut,
    isNavigationKey,
} from "../../../lib/workspace/codeCompletion/keyboard";
import type { UpdateWorkspaceCompletionPopupOptions } from "../../../lib/workspace/codeCompletion/workspaceCodeCompletion.type";
import { shiftCompletionSelection } from "./useWorkspaceCompletionPopupHelpers";

type WorkspaceCompletionPopupKeyboardOptions = {
    acceptCompletion: (completionIndex: number) => void;
    activeEditorMode: string;
    completionPopup: LuauCompletionPopupState | null;
    getActiveEditor: () => AceEditorInstance | null;
    isIntellisenseEnabled: boolean;
    setCompletionPopup: Dispatch<
        SetStateAction<LuauCompletionPopupState | null>
    >;
    suppressNextPassiveCompletionRef: MutableRefObject<boolean>;
    updateCompletionPopup: (
        options?: UpdateWorkspaceCompletionPopupOptions,
    ) => void;
};

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
        setCompletionPopup,
        suppressNextPassiveCompletionRef,
        updateCompletionPopup,
    ]);
}
