import type { ReactElement } from "react";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import {
    DEFAULT_WORKSPACE_EXECUTION_HISTORY_FILTER,
    WORKSPACE_EXECUTION_HISTORY_SEARCH_DEBOUNCE_MS,
} from "../../../constants/workspace/executionHistory";
import { useAppStore } from "../../../hooks/app/useAppStore";
import { useDebouncedValue } from "../../../hooks/shared/useDebouncedValue";
import { useWorkspaceExecutionHistoryPreview } from "../../../hooks/workspace/useWorkspaceExecutionHistoryPreview";
import type { WorkspaceExecutionHistoryEntry } from "../../../lib/workspace/executionHistory/executionHistory.type";
import { getVisibleWorkspaceExecutionHistoryEntries } from "../../../lib/workspace/executionHistory/executionHistorySearch";
import type { WorkspaceExecutionHistoryFilterValue } from "../../../lib/workspace/executionHistory/executionHistorySearch.type";
import { WorkspaceExecutionHistoryPreview } from "./WorkspaceExecutionHistoryPreview";
import { WorkspaceExecutionHistorySidebar } from "./WorkspaceExecutionHistorySidebar";
import { WorkspaceExecutionHistoryToolbar } from "./WorkspaceExecutionHistoryToolbar";

type WorkspaceExecutionHistoryModalProps = {
    isOpen: boolean;
    entries: readonly WorkspaceExecutionHistoryEntry[];
    onClose: () => void;
    onReRun: (entry: WorkspaceExecutionHistoryEntry) => Promise<void>;
};

/**
 * Full-screen modal for browsing, inspecting, and re-running execution history entries.
 *
 * @param props - Component props
 */
export function WorkspaceExecutionHistoryModal({
    isOpen,
    entries,
    onClose,
    onReRun,
}: WorkspaceExecutionHistoryModalProps): ReactElement | null {
    const [query, setQuery] = useState("");
    const [filterValue, setFilterValue] =
        useState<WorkspaceExecutionHistoryFilterValue>(
            DEFAULT_WORKSPACE_EXECUTION_HISTORY_FILTER,
        );
    const debouncedQuery = useDebouncedValue(
        query,
        WORKSPACE_EXECUTION_HISTORY_SEARCH_DEBOUNCE_MS,
    );
    const appTheme = useAppStore((state) => state.theme);
    const cursorStyle = useAppStore(
        (state) => state.editorSettings.cursorStyle,
    );
    const editorFontSize = useAppStore(
        (state) => state.editorSettings.fontSize,
    );
    const isScopeHighlightingEnabled = useAppStore(
        (state) => state.editorSettings.isScopeHighlightingEnabled,
    );
    const isSmoothCaretEnabled = useAppStore(
        (state) => state.editorSettings.isSmoothCaretEnabled,
    );
    const isTabsToSpacesEnabled = useAppStore(
        (state) => state.editorSettings.isTabsToSpacesEnabled,
    );
    const isWordWrapEnabled = useAppStore(
        (state) => state.editorSettings.isWordWrapEnabled,
    );
    const tabSize = useAppStore((state) => state.editorSettings.tabSize);
    const closeExecutionHistory = useEffectEvent(onClose);

    const visibleEntries = useMemo(
        () =>
            getVisibleWorkspaceExecutionHistoryEntries(entries, {
                filterValue,
                query: debouncedQuery,
            }),
        [debouncedQuery, entries, filterValue],
    );

    const executionHistoryPreview = useWorkspaceExecutionHistoryPreview({
        entries: visibleEntries,
        isOpen,
        onReRun,
    });
    const {
        AceEditorComp,
        aceRuntime,
        editorLoadError,
        feedbackMessage,
        isCopying,
        isReRunning,
        selectedEntry,
    } = executionHistoryPreview.state;
    const { copyScript, reRun, retryEditorLoad, selectEntry } =
        executionHistoryPreview.actions;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === "Escape") {
                closeExecutionHistory();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const hasActiveSearch =
        debouncedQuery.trim().length > 0 || filterValue !== "all";

    if (!isOpen) {
        return null;
    }

    return (
        <div
            role="presentation"
            className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="flex h-[min(38rem,84vh)] w-full max-w-[56rem] flex-col overflow-hidden rounded-[0.9rem] border border-fumi-200 bg-fumi-50 shadow-[var(--shadow-app-floating)]">
                <div className="flex shrink-0 items-center justify-between border-b border-fumi-200 py-2.5 pl-4 pr-2.5">
                    <h2 className="text-xs font-semibold tracking-[-0.01em] text-fumi-900">
                        Execution History
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="app-select-none inline-flex h-6 items-center justify-center rounded-md border border-fumi-200 bg-fumi-50 px-2.5 text-[10px] font-semibold text-fumi-500 transition-colors hover:bg-fumi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                    >
                        Close
                    </button>
                </div>

                <div className="flex min-h-0 flex-1">
                    <div className="flex w-80 shrink-0 flex-col border-r border-fumi-200 bg-fumi-50/30">
                        <WorkspaceExecutionHistoryToolbar
                            filterValue={filterValue}
                            query={query}
                            onFilterChange={setFilterValue}
                            onQueryChange={setQuery}
                        />
                        <WorkspaceExecutionHistorySidebar
                            entries={visibleEntries}
                            hasActiveSearch={hasActiveSearch}
                            selectedEntry={selectedEntry}
                            onSelectEntry={selectEntry}
                        />
                    </div>

                    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-fumi-50">
                        <WorkspaceExecutionHistoryPreview
                            aceRuntime={aceRuntime}
                            AceEditorComp={AceEditorComp}
                            appTheme={appTheme}
                            cursorStyle={cursorStyle}
                            editorFontSize={editorFontSize}
                            editorLoadError={editorLoadError}
                            feedbackMessage={feedbackMessage}
                            isCopying={isCopying}
                            isReRunning={isReRunning}
                            isScopeHighlightingEnabled={
                                isScopeHighlightingEnabled
                            }
                            isSmoothCaretEnabled={isSmoothCaretEnabled}
                            isTabsToSpacesEnabled={isTabsToSpacesEnabled}
                            isWordWrapEnabled={isWordWrapEnabled}
                            selectedEntry={selectedEntry}
                            tabSize={tabSize}
                            onCopyScript={copyScript}
                            onReRun={reRun}
                            onRetryEditorLoad={retryEditorLoad}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
