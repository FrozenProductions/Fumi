import { Copy01Icon, PlayIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
    WORKSPACE_EDITOR_OPTIONS,
    WORKSPACE_EDITOR_PROPS,
    WORKSPACE_EDITOR_STYLE,
} from "../../../constants/workspace/editor";
import { joinClassNames } from "../../../lib/shared/className";
import type { AceEditorInstance } from "../../../lib/workspace/codeCompletion/ace.type";
import { applyAceEditorIndentSettings } from "../../../lib/workspace/editor/editor";
import {
    formatWorkspaceExecutionHistoryExecutorKind,
    getWorkspaceExecutionHistoryAccountLabel,
} from "../../../lib/workspace/executionHistory/executionHistorySearch";
import { AppIcon } from "../../app/common/AppIcon";
import { AppTooltip } from "../../app/tooltip/AppTooltip";
import type { WorkspaceExecutionHistoryPreviewProps } from "./workspaceExecutionHistory.type";

function formatExecutionTimestamp(executedAt: number): string {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(executedAt));
}

/**
 * Displays a read-only editor preview of a selected execution history entry.
 *
 * @param props - Component props
 */
export const WorkspaceExecutionHistoryPreview = memo(
    function WorkspaceExecutionHistoryPreview({
        aceRuntime,
        AceEditorComp,
        appTheme,
        cursorStyle,
        editorFontSize,
        editorLoadError,
        feedbackMessage,
        isCopying,
        isReRunning,
        isScopeHighlightingEnabled,
        isSmoothCaretEnabled,
        isTabsToSpacesEnabled,
        isWordWrapEnabled,
        selectedEntry,
        tabSize,
        onCopyScript,
        onReRun,
        onRetryEditorLoad,
    }: WorkspaceExecutionHistoryPreviewProps): ReactElement {
        const editorRef = useRef<AceEditorInstance | null>(null);
        const appliedEntryIdRef = useRef<string | null>(null);
        const editorOptions = useMemo(
            () =>
                ({
                    ...WORKSPACE_EDITOR_OPTIONS,
                    animatedScroll: isSmoothCaretEnabled,
                    cursorStyle,
                    useSoftTabs: isTabsToSpacesEnabled,
                }) as const,
            [cursorStyle, isSmoothCaretEnabled, isTabsToSpacesEnabled],
        );
        const editorClassName = useMemo(
            () =>
                joinClassNames(
                    "workspace-ace-editor",
                    isSmoothCaretEnabled && "workspace-ace-editor-smooth-caret",
                    !isScopeHighlightingEnabled &&
                        "workspace-ace-editor-disable-scope-highlight",
                ),
            [isScopeHighlightingEnabled, isSmoothCaretEnabled],
        );

        useEffect(() => {
            const editor = editorRef.current;

            if (!editor) {
                return;
            }

            applyAceEditorIndentSettings(editor, {
                isTabsToSpacesEnabled,
                tabSize,
            });
        }, [isTabsToSpacesEnabled, tabSize]);

        useLayoutEffect(() => {
            const editor = editorRef.current;

            if (!editor || !selectedEntry) {
                appliedEntryIdRef.current = null;
                return;
            }

            if (appliedEntryIdRef.current === selectedEntry.id) {
                return;
            }

            appliedEntryIdRef.current = selectedEntry.id;
            editor.setValue(selectedEntry.scriptContent, -1);
            editor.selection.moveCursorTo(0, 0);
            editor.clearSelection();
            editor.renderer.scrollToY(0);
        }, [selectedEntry]);

        if (!selectedEntry) {
            return (
                <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6">
                    <div className="max-w-xs text-center">
                        <p className="text-xs font-semibold text-fumi-900">
                            Select an execution
                        </p>
                        <p className="mt-1.5 text-[10px] leading-relaxed text-fumi-500">
                            Pick an entry from the list to inspect or replay
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <>
                <div className="shrink-0 border-b border-fumi-200 px-3 py-2">
                    <div className="flex items-center gap-3">
                        <div className="flex shrink-0 gap-1">
                            <AppTooltip content="Re-run script">
                                <button
                                    type="button"
                                    onClick={() => {
                                        void onReRun();
                                    }}
                                    disabled={isReRunning}
                                    className="app-select-none inline-flex size-6 items-center justify-center rounded-md bg-fumi-600 text-white transition-colors hover:bg-fumi-700 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                                    aria-label="Re-run script"
                                >
                                    <AppIcon
                                        icon={PlayIcon}
                                        size={12}
                                        strokeWidth={2.5}
                                    />
                                </button>
                            </AppTooltip>
                            <AppTooltip content="Copy script">
                                <button
                                    type="button"
                                    onClick={() => {
                                        void onCopyScript();
                                    }}
                                    disabled={isCopying}
                                    className="app-select-none inline-flex size-6 items-center justify-center rounded-md border border-fumi-200 bg-fumi-50 text-fumi-600 transition-colors hover:bg-fumi-100 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                                    aria-label="Copy script"
                                >
                                    {isCopying ? (
                                        <AppIcon
                                            icon={Tick01Icon}
                                            size={12}
                                            strokeWidth={2.5}
                                        />
                                    ) : (
                                        <AppIcon
                                            icon={Copy01Icon}
                                            size={12}
                                            strokeWidth={2.5}
                                        />
                                    )}
                                </button>
                            </AppTooltip>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[11px] font-semibold leading-tight tracking-[-0.01em] text-fumi-900">
                                {selectedEntry.fileName}
                            </h3>
                            <p className="mt-0.5 truncate text-[10px] font-semibold text-fumi-500">
                                {formatExecutionTimestamp(
                                    selectedEntry.executedAt,
                                )}
                                {" · "}
                                {formatWorkspaceExecutionHistoryExecutorKind(
                                    selectedEntry.executorKind,
                                )}
                                {" · Port "}
                                {selectedEntry.port}
                                {" · "}
                                {getWorkspaceExecutionHistoryAccountLabel(
                                    selectedEntry,
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {feedbackMessage ? (
                    <div className="shrink-0 border-b border-fumi-200 px-4 py-1.5">
                        <p className="text-[10px] font-semibold text-fumi-600">
                            {feedbackMessage}
                        </p>
                    </div>
                ) : null}

                <div className="min-h-0 flex-1">
                    {AceEditorComp && aceRuntime ? (
                        <div className="flex h-full min-h-0 flex-col">
                            <AceEditorComp
                                className={editorClassName}
                                name="execution-history-editor"
                                defaultValue={selectedEntry.scriptContent}
                                mode={aceRuntime.getMode(
                                    selectedEntry.fileName,
                                )}
                                theme={aceRuntime.getTheme(appTheme)}
                                width="100%"
                                height="100%"
                                fontSize={editorFontSize}
                                readOnly
                                highlightActiveLine
                                enableBasicAutocompletion={false}
                                enableLiveAutocompletion={false}
                                enableSnippets={false}
                                showGutter
                                showPrintMargin={false}
                                navigateToFileEnd={false}
                                tabSize={tabSize}
                                wrapEnabled={isWordWrapEnabled}
                                setOptions={editorOptions}
                                style={WORKSPACE_EDITOR_STYLE}
                                onLoad={(editor: AceEditorInstance) => {
                                    editorRef.current = editor;
                                    appliedEntryIdRef.current =
                                        selectedEntry.id;
                                    applyAceEditorIndentSettings(editor, {
                                        isTabsToSpacesEnabled,
                                        tabSize,
                                    });
                                    editor.selection.moveCursorTo(0, 0);
                                    editor.clearSelection();
                                    editor.renderer.scrollToY(0);
                                }}
                                editorProps={WORKSPACE_EDITOR_PROPS}
                            />
                        </div>
                    ) : editorLoadError ? (
                        <div className="flex h-full items-center justify-center bg-fumi-50 px-4">
                            <div className="max-w-xs text-center">
                                <p className="text-xs font-semibold text-fumi-900">
                                    Could not load preview
                                </p>
                                <p className="mt-1.5 text-[10px] leading-relaxed text-fumi-500">
                                    {editorLoadError}
                                </p>
                                <button
                                    type="button"
                                    onClick={onRetryEditorLoad}
                                    className="mt-3 inline-flex h-7 items-center justify-center rounded-md border border-fumi-200 bg-fumi-50 px-3 text-[10px] font-semibold text-fumi-600 transition-colors hover:bg-fumi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center bg-fumi-50">
                            <div className="text-center">
                                <div className="mx-auto mb-3 size-5 animate-spin rounded-full border-2 border-fumi-200 border-t-fumi-500" />
                                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                                    Loading editor
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    },
);
