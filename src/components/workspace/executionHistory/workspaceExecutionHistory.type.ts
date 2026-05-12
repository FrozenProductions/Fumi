import type {
    AppEditorCursorStyle,
    AppEditorTabSize,
    AppTheme,
} from "../../../lib/app/app.type";
import type { LoadedAceRuntime } from "../../../lib/luau/ace/loadAceRuntime.type";
import type { AceEditorComponent } from "../../../lib/workspace/editor/editor.type";
import type { WorkspaceExecutionHistoryEntry } from "../../../lib/workspace/executionHistory/executionHistory.type";
import type { WorkspaceExecutionHistoryFilterValue } from "../../../lib/workspace/executionHistory/executionHistorySearch.type";

export type WorkspaceExecutionHistoryToolbarProps = {
    filterValue: WorkspaceExecutionHistoryFilterValue;
    query: string;
    onFilterChange: (filterValue: WorkspaceExecutionHistoryFilterValue) => void;
    onQueryChange: (query: string) => void;
};

export type WorkspaceExecutionHistorySidebarProps = {
    entries: readonly WorkspaceExecutionHistoryEntry[];
    hasActiveSearch: boolean;
    selectedEntry: WorkspaceExecutionHistoryEntry | null;
    onSelectEntry: (entryId: string) => void;
};

export type WorkspaceExecutionHistoryPreviewProps = {
    aceRuntime: LoadedAceRuntime | null;
    AceEditorComp: AceEditorComponent | null;
    appTheme: AppTheme;
    cursorStyle: AppEditorCursorStyle;
    editorFontSize: number;
    editorLoadError: string | null;
    feedbackMessage: string | null;
    isCopying: boolean;
    isReRunning: boolean;
    isScopeHighlightingEnabled: boolean;
    isSmoothCaretEnabled: boolean;
    isTabsToSpacesEnabled: boolean;
    isWordWrapEnabled: boolean;
    selectedEntry: WorkspaceExecutionHistoryEntry | null;
    tabSize: AppEditorTabSize;
    onCopyScript: () => Promise<void>;
    onReRun: () => Promise<void>;
    onRetryEditorLoad: () => void;
};
