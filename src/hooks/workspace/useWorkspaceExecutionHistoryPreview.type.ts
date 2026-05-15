import type { LoadedAceRuntime } from "../../lib/luau/ace/loadAceRuntime.type";
import type { AceEditorComponent } from "../../lib/workspace/editor/editor.type";
import type { WorkspaceExecutionHistoryEntry } from "../../lib/workspace/executionHistory/executionHistory.type";

export type UseWorkspaceExecutionHistoryPreviewOptions = {
    entries: readonly WorkspaceExecutionHistoryEntry[];
    isOpen: boolean;
    onReRun: (entry: WorkspaceExecutionHistoryEntry) => Promise<void>;
};

export type UseWorkspaceExecutionHistoryPreviewResult = {
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

export type WorkspaceExecutionHistoryPreviewLoadState = {
    AceEditorComp: AceEditorComponent | null;
    aceRuntime: LoadedAceRuntime | null;
    editorLoadError: string | null;
    editorLoadNonce: number;
    feedbackMessage: string | null;
};
