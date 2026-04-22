import type { ReactElement } from "react";
import { useEffect } from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWorkspaceExecutionHistoryPreview } from "../../hooks/workspace/useWorkspaceExecutionHistoryPreview";
import type { WorkspaceExecutionHistoryEntry } from "../../lib/workspace/workspace.type";
import { WorkspaceExecutionHistoryPreview } from "./WorkspaceExecutionHistoryPreview";
import { WorkspaceExecutionHistorySidebar } from "./WorkspaceExecutionHistorySidebar";

type WorkspaceExecutionHistoryModalProps = {
    isOpen: boolean;
    entries: readonly WorkspaceExecutionHistoryEntry[];
    onClose: () => void;
    onReRun: (entry: WorkspaceExecutionHistoryEntry) => Promise<void>;
};

export function WorkspaceExecutionHistoryModal({
    isOpen,
    entries,
    onClose,
    onReRun,
}: WorkspaceExecutionHistoryModalProps): ReactElement | null {
    const appTheme = useAppStore((state) => state.theme);
    const editorFontSize = useAppStore(
        (state) => state.editorSettings.fontSize,
    );
    const isWordWrapEnabled = useAppStore(
        (state) => state.editorSettings.isWordWrapEnabled,
    );

    const executionHistoryPreview = useWorkspaceExecutionHistoryPreview({
        entries,
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
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="flex h-[min(36rem,80vh)] w-full max-w-[44rem] flex-col overflow-hidden rounded-[0.9rem] border border-fumi-200 bg-fumi-50 shadow-[var(--shadow-app-floating)]">
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
                    <div className="flex w-60 shrink-0 flex-col border-r border-fumi-200 bg-fumi-50/30">
                        <WorkspaceExecutionHistorySidebar
                            entries={entries}
                            selectedEntry={selectedEntry}
                            onSelectEntry={selectEntry}
                        />
                    </div>

                    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-fumi-50">
                        <WorkspaceExecutionHistoryPreview
                            aceRuntime={aceRuntime}
                            AceEditorComp={AceEditorComp}
                            appTheme={appTheme}
                            editorFontSize={editorFontSize}
                            editorLoadError={editorLoadError}
                            feedbackMessage={feedbackMessage}
                            isCopying={isCopying}
                            isReRunning={isReRunning}
                            isWordWrapEnabled={isWordWrapEnabled}
                            selectedEntry={selectedEntry}
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
