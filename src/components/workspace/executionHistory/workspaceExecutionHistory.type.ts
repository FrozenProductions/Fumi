import type { AppTheme } from "../../../lib/app/app.type";
import type { LoadedAceRuntime } from "../../../lib/luau/ace/loadAceRuntime.type";
import type { AceEditorComponent } from "../../../lib/workspace/editor/editor.type";
import type { WorkspaceExecutionHistoryEntry } from "../../../lib/workspace/workspace.type";

export type WorkspaceExecutionHistorySidebarProps = {
    entries: readonly WorkspaceExecutionHistoryEntry[];
    selectedEntry: WorkspaceExecutionHistoryEntry | null;
    onSelectEntry: (entryId: string) => void;
};

export type WorkspaceExecutionHistoryPreviewProps = {
    aceRuntime: LoadedAceRuntime | null;
    AceEditorComp: AceEditorComponent | null;
    appTheme: AppTheme;
    editorFontSize: number;
    editorLoadError: string | null;
    feedbackMessage: string | null;
    isCopying: boolean;
    isReRunning: boolean;
    isWordWrapEnabled: boolean;
    selectedEntry: WorkspaceExecutionHistoryEntry | null;
    onCopyScript: () => Promise<void>;
    onReRun: () => Promise<void>;
    onRetryEditorLoad: () => void;
};
