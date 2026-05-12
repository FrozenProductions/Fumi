import type { RefObject } from "react";
import { useEffect } from "react";
import type { AceEditorInstance } from "../../../lib/workspace/codeCompletion/ace.type";
import type { WorkspaceTab } from "../../../lib/workspace/session/tabs/sessionTabs.type";
import { useAppStore } from "../../app/useAppStore";

export type StoredAceSessionState = {
    content: string;
    scrollLeft: number;
    scrollTop: number;
    selection: unknown;
    undoHistory: object;
};

export type AceSelectionEventTarget = {
    on: (eventName: "changeCursor", listener: () => void) => void;
    off: (eventName: "changeCursor", listener: () => void) => void;
};

export type AceEditorDestroyEventTarget = AceEditorInstance & {
    destroyed?: boolean;
    on: (eventName: "destroy", listener: () => void) => void;
    off: (eventName: "destroy", listener: () => void) => void;
};

type UseWorkspaceCodeCompletionLifecycleOptions = {
    activeTabId: string | null;
    closeCompletionPopup: () => void;
    cursorListenerCleanupByTabIdRef: RefObject<Map<string, () => void>>;
    editorByTabIdRef: RefObject<Map<string, AceEditorInstance>>;
    getActiveEditor: () => AceEditorInstance | null;
    goToLine: (lineNumber: number) => boolean;
    saveActiveWorkspaceTab: () => Promise<void>;
    sessionStateByTabIdRef: RefObject<Map<string, StoredAceSessionState>>;
    tabs: readonly WorkspaceTab[];
};

/**
 * Manages editor lifecycle concerns: save shortcut, tab switching, go-to-line, and orphaned editor cleanup.
 *
 * Registers a global Cmd/Ctrl+S shortcut, resizes and focuses the active editor on tab change,
 * processes go-to-line requests, and prunes stale editor refs when tabs close.
 *
 * @param options.activeTabId - Currently active tab ID
 * @param options.closeCompletionPopup - Callback to dismiss the completion popup
 * @param options.cursorListenerCleanupByTabIdRef - Map of cleanup functions for cursor listeners
 * @param options.editorByTabIdRef - Map of Ace editor instances keyed by tab ID
 * @param options.getActiveEditor - Returns the currently focused Ace editor instance
 * @param options.goToLine - Navigates the editor to a specific line number
 * @param options.saveActiveWorkspaceTab - Persists the active tab's content
 * @param options.sessionStateByTabIdRef - Map of stored Ace session states keyed by tab ID
 * @param options.tabs - Currently open workspace tabs
 */
export function useWorkspaceCodeCompletionLifecycle({
    activeTabId,
    closeCompletionPopup,
    cursorListenerCleanupByTabIdRef,
    editorByTabIdRef,
    getActiveEditor,
    goToLine,
    saveActiveWorkspaceTab,
    sessionStateByTabIdRef,
    tabs,
}: UseWorkspaceCodeCompletionLifecycleOptions): void {
    const clearGoToLineRequest = useAppStore(
        (state) => state.clearGoToLineRequest,
    );
    const goToLineRequest = useAppStore((state) => state.goToLineRequest);

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
                cursorListenerCleanupByTabIdRef.current.get(tabId)?.();
                cursorListenerCleanupByTabIdRef.current.delete(tabId);
                editorByTabIdRef.current.delete(tabId);
            }
        }

        for (const tabId of sessionStateByTabIdRef.current.keys()) {
            if (!openTabIds.has(tabId)) {
                sessionStateByTabIdRef.current.delete(tabId);
            }
        }
    }, [
        cursorListenerCleanupByTabIdRef,
        editorByTabIdRef,
        sessionStateByTabIdRef,
        tabs,
    ]);
}
