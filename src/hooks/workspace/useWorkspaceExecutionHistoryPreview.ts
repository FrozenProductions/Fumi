import { useCallback, useEffect, useReducer, useState } from "react";
import { loadAceRuntime } from "../../lib/luau/ace/loadAceRuntime";
import { copyTextToClipboard } from "../../lib/platform/core/clipboard";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import { getReactAceComponent } from "../../lib/workspace/editor/editor";
import type {
    UseWorkspaceExecutionHistoryPreviewOptions,
    UseWorkspaceExecutionHistoryPreviewResult,
    WorkspaceExecutionHistoryPreviewLoadState,
} from "./useWorkspaceExecutionHistoryPreview.type";

function updateWorkspaceExecutionHistoryPreviewLoadState(
    currentState: WorkspaceExecutionHistoryPreviewLoadState,
    nextState: Partial<WorkspaceExecutionHistoryPreviewLoadState>,
): WorkspaceExecutionHistoryPreviewLoadState {
    return {
        ...currentState,
        ...nextState,
    };
}

/**
 * Loads the read-only Ace preview and owns per-entry execution history actions.
 *
 * @param options - Hook options
 * @param options.entries - The execution history entries to display
 * @param options.isOpen - Whether the history panel is currently open
 * @param options.onReRun - Callback to re-run a selected history entry
 * @returns Preview state including Ace component, selected entry, and action functions
 */
export function useWorkspaceExecutionHistoryPreview({
    entries,
    isOpen,
    onReRun,
}: UseWorkspaceExecutionHistoryPreviewOptions): UseWorkspaceExecutionHistoryPreviewResult {
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
        entries[0]?.id ?? null,
    );
    const [isCopying, setIsCopying] = useState(false);
    const [isReRunning, setIsReRunning] = useState(false);
    const [loadState, dispatchLoadState] = useReducer(
        updateWorkspaceExecutionHistoryPreviewLoadState,
        {
            AceEditorComp: null,
            aceRuntime: null,
            editorLoadError: null,
            editorLoadNonce: 0,
            feedbackMessage: null,
        },
    );
    const {
        AceEditorComp,
        aceRuntime,
        editorLoadError,
        editorLoadNonce,
        feedbackMessage,
    } = loadState;
    const selectedEntry =
        entries.find((entry) => entry.id === selectedEntryId) ??
        entries[0] ??
        null;

    useEffect(() => {
        if (!isOpen) {
            dispatchLoadState({
                feedbackMessage: null,
                editorLoadError: null,
            });
            return;
        }

        const hasSelectedEntry = entries.some(
            (entry) => entry.id === selectedEntryId,
        );

        if (!hasSelectedEntry) {
            setSelectedEntryId(entries[0]?.id ?? null);
        }
    }, [entries, isOpen, selectedEntryId]);

    useEffect(() => {
        if (!isOpen || (AceEditorComp !== null && aceRuntime !== null)) {
            return;
        }

        if (editorLoadNonce > 0) {
            dispatchLoadState({ feedbackMessage: null });
        }

        let isMounted = true;

        void (async () => {
            try {
                const [loadedAceRuntime, reactAceModule] = await Promise.all([
                    loadAceRuntime(),
                    import("react-ace"),
                ]);
                const reactAceComponent = getReactAceComponent(reactAceModule);

                if (!isMounted) {
                    return;
                }

                dispatchLoadState({
                    editorLoadError: null,
                    aceRuntime: loadedAceRuntime,
                    AceEditorComp: reactAceComponent,
                });
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                dispatchLoadState({
                    editorLoadError: getErrorMessage(
                        error,
                        "Could not load the script preview.",
                    ),
                });
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [AceEditorComp, aceRuntime, editorLoadNonce, isOpen]);

    const copyScript = useCallback(async (): Promise<void> => {
        if (!selectedEntry || isCopying) {
            return;
        }

        setIsCopying(true);

        try {
            await copyTextToClipboard(selectedEntry.scriptContent);
            dispatchLoadState({ feedbackMessage: "Copied script." });
        } catch (error) {
            dispatchLoadState({
                feedbackMessage: getErrorMessage(
                    error,
                    "Could not copy the stored script.",
                ),
            });
        } finally {
            setIsCopying(false);
        }
    }, [isCopying, selectedEntry]);

    const reRun = useCallback(async (): Promise<void> => {
        if (!selectedEntry || isReRunning) {
            return;
        }

        setIsReRunning(true);
        dispatchLoadState({ feedbackMessage: null });

        try {
            await onReRun(selectedEntry);
        } finally {
            setIsReRunning(false);
        }
    }, [isReRunning, onReRun, selectedEntry]);

    const retryEditorLoad = useCallback((): void => {
        dispatchLoadState({
            editorLoadError: null,
            aceRuntime: null,
            AceEditorComp: null,
            editorLoadNonce: editorLoadNonce + 1,
        });
    }, [editorLoadNonce]);

    return {
        state: {
            AceEditorComp,
            aceRuntime,
            editorLoadError,
            feedbackMessage,
            isCopying,
            isReRunning,
            selectedEntry,
            selectedEntryId,
        },
        actions: {
            copyScript,
            reRun,
            retryEditorLoad,
            selectEntry: setSelectedEntryId,
        },
    };
}
