import type { RefObject } from "react";
import { useCallback } from "react";
import { bindWorkspaceEditorShortcuts } from "../../../lib/workspace/codeCompletion/ace";
import type { AceEditorInstance } from "../../../lib/workspace/codeCompletion/ace.type";
import type { WorkspaceTab } from "../../../lib/workspace/session/tabs/sessionTabs.type";
import type {
    AceEditorDestroyEventTarget,
    AceSelectionEventTarget,
    StoredAceSessionState,
} from "./useWorkspaceCodeCompletionLifecycle";

type UseWorkspaceEditorLoadHandlerOptions = {
    activeTabIdRef: RefObject<string | null>;
    closeCompletionPopup: () => void;
    cursorListenerCleanupByTabIdRef: RefObject<Map<string, () => void>>;
    editorByTabIdRef: RefObject<Map<string, AceEditorInstance>>;
    handleEditorCursorChangeRef: RefObject<(tabId: string) => void>;
    sessionStateByTabIdRef: RefObject<Map<string, StoredAceSessionState>>;
    tabsByIdRef: RefObject<Map<string, WorkspaceTab>>;
    toggleSearch: () => void;
};

/**
 * Returns a stable callback that initializes an Ace editor instance when loaded for a tab.
 *
 * Binds editor shortcuts, registers cursor-change listeners with destroy cleanup,
 * restores stored session state (undo history, scroll position, selection), and
 * positions the cursor for new sessions.
 *
 * @param options - Refs and callbacks needed for editor initialization
 * @returns A function that, given a tab ID, returns an editor load handler
 */
export function useWorkspaceEditorLoadHandler({
    activeTabIdRef,
    closeCompletionPopup,
    cursorListenerCleanupByTabIdRef,
    editorByTabIdRef,
    handleEditorCursorChangeRef,
    sessionStateByTabIdRef,
    tabsByIdRef,
    toggleSearch,
}: UseWorkspaceEditorLoadHandlerOptions): (
    tabId: string,
) => (editor: unknown) => void {
    return useCallback(
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
                cursorListenerCleanupByTabIdRef.current.get(tabId)?.();
                const editorEventTarget =
                    aceEditor as AceEditorDestroyEventTarget;
                const selection = session.selection as AceSelectionEventTarget;
                const handleCursorChange = (): void => {
                    handleEditorCursorChangeRef.current(tabId);
                };
                const cleanupCursorListener = (): void => {
                    selection.off("changeCursor", handleCursorChange);
                    editorEventTarget.off("destroy", cleanupCursorListener);
                };
                selection.on("changeCursor", handleCursorChange);
                editorEventTarget.on("destroy", cleanupCursorListener);
                cursorListenerCleanupByTabIdRef.current.set(
                    tabId,
                    cleanupCursorListener,
                );

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
                        editorByTabIdRef.current.get(tabId) !== aceEditor ||
                        (aceEditor as AceEditorDestroyEventTarget).destroyed
                    ) {
                        return;
                    }

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
        [
            activeTabIdRef,
            closeCompletionPopup,
            cursorListenerCleanupByTabIdRef,
            editorByTabIdRef,
            handleEditorCursorChangeRef,
            sessionStateByTabIdRef,
            tabsByIdRef,
            toggleSearch,
        ],
    );
}
