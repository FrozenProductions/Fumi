import { useEffect, useState } from "react";
import { loadAceRuntime } from "../../lib/luau/ace/loadAceRuntime";
import type { LoadedAceRuntime } from "../../lib/luau/ace/loadAceRuntime.type";
import { copyTextToClipboard } from "../../lib/platform/clipboard";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import { getReactAceComponent } from "../../lib/workspace/editor/editor";
import type { AceEditorComponent } from "../../lib/workspace/editor/editor.type";
import type { WorkspaceExecutionHistoryEntry } from "../../lib/workspace/workspace.type";

type UseWorkspaceExecutionHistoryPreviewOptions = {
    entries: readonly WorkspaceExecutionHistoryEntry[];
    isOpen: boolean;
    onReRun: (entry: WorkspaceExecutionHistoryEntry) => Promise<void>;
};

type UseWorkspaceExecutionHistoryPreviewResult = {
    state: {
        AceEditorComp: AceEditorComponent | null;
        aceRuntime: LoadedAceRuntime | null;
        editorLoadError: string | null;
        feedbackMessage: string | null;
        isCopying: boolean;
        isReRunning: boolean;
        selectedEntry: WorkspaceExecutionHistoryEntry | null;
        selectedEntryId: string | null;
    };
    actions: {
        copyScript: () => Promise<void>;
        reRun: () => Promise<void>;
        retryEditorLoad: () => void;
        selectEntry: (entryId: string) => void;
    };
};

/**
 * Loads the read-only Ace preview and owns per-entry execution history actions.
 */
export function useWorkspaceExecutionHistoryPreview({
    entries,
    isOpen,
    onReRun,
}: UseWorkspaceExecutionHistoryPreviewOptions): UseWorkspaceExecutionHistoryPreviewResult {
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
        entries[0]?.id ?? null,
    );
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [isReRunning, setIsReRunning] = useState(false);
    const [editorLoadError, setEditorLoadError] = useState<string | null>(null);
    const [editorLoadNonce, setEditorLoadNonce] = useState(0);
    const [AceEditorComp, setAceEditorComp] =
        useState<AceEditorComponent | null>(null);
    const [aceRuntime, setAceRuntime] = useState<LoadedAceRuntime | null>(null);
    const selectedEntry =
        entries.find((entry) => entry.id === selectedEntryId) ??
        entries[0] ??
        null;

    useEffect(() => {
        if (!isOpen) {
            setFeedbackMessage(null);
            setEditorLoadError(null);
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
            setFeedbackMessage(null);
        }

        let isMounted = true;

        void (async () => {
            try {
                const loadedAceRuntime = await loadAceRuntime();
                const reactAceModule = await import("react-ace");
                const reactAceComponent = getReactAceComponent(reactAceModule);

                if (!isMounted) {
                    return;
                }

                setEditorLoadError(null);
                setAceRuntime(loadedAceRuntime);
                setAceEditorComp(() => reactAceComponent);
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                setEditorLoadError(
                    getErrorMessage(
                        error,
                        "Could not load the script preview.",
                    ),
                );
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [AceEditorComp, aceRuntime, editorLoadNonce, isOpen]);

    const copyScript = async (): Promise<void> => {
        if (!selectedEntry || isCopying) {
            return;
        }

        setIsCopying(true);

        try {
            await copyTextToClipboard(selectedEntry.scriptContent);
            setFeedbackMessage("Copied script.");
        } catch (error) {
            setFeedbackMessage(
                getErrorMessage(error, "Could not copy the stored script."),
            );
        } finally {
            setIsCopying(false);
        }
    };

    const reRun = async (): Promise<void> => {
        if (!selectedEntry || isReRunning) {
            return;
        }

        setIsReRunning(true);
        setFeedbackMessage(null);

        try {
            await onReRun(selectedEntry);
        } finally {
            setIsReRunning(false);
        }
    };

    const retryEditorLoad = (): void => {
        setEditorLoadError(null);
        setAceRuntime(null);
        setAceEditorComp(null);
        setEditorLoadNonce((currentValue) => currentValue + 1);
    };

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
