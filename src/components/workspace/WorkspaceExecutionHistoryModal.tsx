import {
    Calendar01Icon,
    Copy01Icon,
    Key01Icon,
    PlayIcon,
    Tick01Icon,
} from "@hugeicons/core-free-icons";
import type { Ace } from "ace-builds";
import { type ReactElement, useEffect, useMemo, useState } from "react";
import {
    WORKSPACE_EDITOR_PROPS,
    WORKSPACE_EDITOR_STYLE,
} from "../../constants/workspace/editor";
import {
    EXECUTION_HISTORY_EDITOR_OPTIONS,
    EXECUTION_HISTORY_LARGE_SCRIPT_EDITOR_OPTIONS,
} from "../../constants/workspace/executionHistory";
import { useAppStore } from "../../hooks/app/useAppStore";
import { loadAceRuntime } from "../../lib/luau/loadAceRuntime";
import type { LoadedAceRuntime } from "../../lib/luau/loadAceRuntime.type";
import { copyTextToClipboard } from "../../lib/platform/clipboard";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import { getReactAceComponent } from "../../lib/workspace/editor";
import type { AceEditorComponent } from "../../lib/workspace/editor.type";
import { isLargeExecutionHistoryScript } from "../../lib/workspace/executionHistory";
import type { WorkspaceExecutionHistoryEntry } from "../../lib/workspace/workspace.type";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";

type WorkspaceExecutionHistoryModalProps = {
    isOpen: boolean;
    entries: readonly WorkspaceExecutionHistoryEntry[];
    onClose: () => void;
    onReRun: (entry: WorkspaceExecutionHistoryEntry) => Promise<void>;
};

function formatExecutionTimestamp(executedAt: number): string {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(executedAt));
}

function formatExecutorKind(
    executorKind: WorkspaceExecutionHistoryEntry["executorKind"],
): string {
    switch (executorKind) {
        case "macsploit":
            return "Macsploit";
        case "opiumware":
            return "Opiumware";
        default:
            return "Unsupported";
    }
}

function formatAccountLabel(entry: WorkspaceExecutionHistoryEntry): string {
    if (entry.accountDisplayName) {
        return entry.accountDisplayName;
    }

    if (entry.accountId) {
        return entry.accountId;
    }

    if (entry.isBoundToUnknownAccount) {
        return "Unknown bound account";
    }

    return "No account bound";
}

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

    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
        entries[0]?.id ?? null,
    );
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [isReRunning, setIsReRunning] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [executorFilter, setExecutorFilter] = useState<
        WorkspaceExecutionHistoryEntry["executorKind"] | "all"
    >("all");
    const [editorLoadError, setEditorLoadError] = useState<string | null>(null);
    const [editorLoadNonce, setEditorLoadNonce] = useState(0);
    const [AceEditorComp, setAceEditorComp] =
        useState<AceEditorComponent | null>(null);
    const [aceRuntime, setAceRuntime] = useState<LoadedAceRuntime | null>(null);
    const filteredEntries = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return entries.filter((entry) => {
            if (
                executorFilter !== "all" &&
                entry.executorKind !== executorFilter
            ) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            const searchHaystack = [
                entry.fileName,
                formatExecutorKind(entry.executorKind),
                formatAccountLabel(entry),
                String(entry.port),
            ]
                .join(" ")
                .toLowerCase();

            return searchHaystack.includes(normalizedQuery);
        });
    }, [entries, executorFilter, searchQuery]);
    const selectedEntry =
        filteredEntries.find((entry) => entry.id === selectedEntryId) ??
        filteredEntries[0] ??
        null;
    const isLargeScript =
        selectedEntry !== null &&
        isLargeExecutionHistoryScript(selectedEntry.scriptContent);

    useEffect(() => {
        if (!isOpen) {
            setFeedbackMessage(null);
            setEditorLoadError(null);
            return;
        }

        const hasSelectedEntry = filteredEntries.some(
            (entry) => entry.id === selectedEntryId,
        );

        if (!hasSelectedEntry) {
            setSelectedEntryId(filteredEntries[0]?.id ?? null);
        }
    }, [filteredEntries, isOpen, selectedEntryId]);

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

    if (!isOpen) {
        return null;
    }

    const handleCopyScript = async (): Promise<void> => {
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

    const handleReRun = async (): Promise<void> => {
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

    const handleRetryEditorLoad = (): void => {
        setEditorLoadError(null);
        setAceRuntime(null);
        setAceEditorComp(null);
        setEditorLoadNonce((currentValue) => currentValue + 1);
    };

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
                        <div className="shrink-0 border-b border-fumi-200 p-2">
                            <div className="flex flex-col gap-2">
                                <input
                                    value={searchQuery}
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value);
                                    }}
                                    placeholder="Filter by file, account, or port"
                                    className="h-8 rounded-md border border-fumi-200 bg-fumi-50 px-2.5 text-[11px] font-medium text-fumi-900 placeholder:text-fumi-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                                />
                                <div className="flex items-center gap-2">
                                    <select
                                        value={executorFilter}
                                        onChange={(event) => {
                                            setExecutorFilter(
                                                event.target.value as
                                                    | WorkspaceExecutionHistoryEntry["executorKind"]
                                                    | "all",
                                            );
                                        }}
                                        className="h-8 min-w-0 flex-1 rounded-md border border-fumi-200 bg-fumi-50 px-2.5 text-[11px] font-medium text-fumi-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                                    >
                                        <option value="all">
                                            All executors
                                        </option>
                                        <option value="macsploit">
                                            Macsploit
                                        </option>
                                        <option value="opiumware">
                                            Opiumware
                                        </option>
                                        <option value="unsupported">
                                            Unsupported
                                        </option>
                                    </select>
                                    <span className="shrink-0 text-[10px] font-semibold text-fumi-500">
                                        {filteredEntries.length}/
                                        {entries.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {entries.length > 0 ? (
                            <div className="min-h-0 flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar-thumb:hover]:bg-[rgb(var(--color-scrollbar-thumb-hover)/1)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[rgb(var(--color-scrollbar-thumb)/1)] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar]:w-[6px]">
                                <div className="flex flex-col gap-0.5">
                                    {filteredEntries.map((entry) => {
                                        const isSelected =
                                            entry.id === selectedEntry?.id;

                                        return (
                                            <button
                                                key={entry.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedEntryId(entry.id)
                                                }
                                                className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                                    isSelected
                                                        ? "bg-fumi-100 text-fumi-900 shadow-sm ring-1 ring-fumi-200"
                                                        : "text-fumi-700 hover:bg-fumi-100/60"
                                                }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-[11px] font-semibold leading-tight">
                                                        {entry.fileName}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-fumi-500">
                                                        <span className="flex items-center gap-0.5">
                                                            <AppIcon
                                                                icon={
                                                                    Calendar01Icon
                                                                }
                                                                size={9}
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                            {formatExecutionTimestamp(
                                                                entry.executedAt,
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-0.5">
                                                            <AppIcon
                                                                icon={Key01Icon}
                                                                size={9}
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                            {entry.port}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {filteredEntries.length === 0 ? (
                                    <div className="flex min-h-24 items-center justify-center px-4 py-6 text-center">
                                        <p className="text-[10px] font-semibold text-fumi-500">
                                            No executions match the active
                                            filters
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6 text-center">
                                <p className="text-[10px] font-semibold text-fumi-500">
                                    No executions yet
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-fumi-50">
                        {selectedEntry ? (
                            <>
                                <div className="shrink-0 border-b border-fumi-200 px-3 py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex shrink-0 gap-1">
                                            <AppTooltip content="Re-run script">
                                                <button
                                                    type="button"
                                                    onClick={handleReRun}
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
                                                    onClick={handleCopyScript}
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
                                                {formatExecutorKind(
                                                    selectedEntry.executorKind,
                                                )}
                                                {" · Port "}
                                                {selectedEntry.port}
                                                {" · "}
                                                {formatAccountLabel(
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
                                            {isLargeScript ? (
                                                <div className="shrink-0 border-b border-fumi-200 px-4 py-1.5">
                                                    <p className="text-[10px] font-semibold text-fumi-500">
                                                        Large snapshot loaded in
                                                        optimized editor mode to
                                                        keep the app responsive.
                                                    </p>
                                                </div>
                                            ) : null}
                                            <AceEditorComp
                                                key={selectedEntry.id}
                                                className="workspace-ace-editor"
                                                name={`execution-history-editor-${selectedEntry.id}`}
                                                defaultValue={
                                                    selectedEntry.scriptContent
                                                }
                                                mode={
                                                    isLargeScript
                                                        ? aceRuntime.getTextMode()
                                                        : aceRuntime.getMode(
                                                              selectedEntry.fileName,
                                                          )
                                                }
                                                theme={aceRuntime.getTheme(
                                                    appTheme,
                                                )}
                                                width="100%"
                                                height="100%"
                                                fontSize={Math.max(
                                                    editorFontSize - 2,
                                                    10,
                                                )}
                                                readOnly
                                                highlightActiveLine={false}
                                                enableBasicAutocompletion={
                                                    false
                                                }
                                                enableLiveAutocompletion={false}
                                                enableSnippets={false}
                                                showGutter
                                                showPrintMargin={false}
                                                navigateToFileEnd={false}
                                                tabSize={4}
                                                wrapEnabled={false}
                                                setOptions={
                                                    isLargeScript
                                                        ? EXECUTION_HISTORY_LARGE_SCRIPT_EDITOR_OPTIONS
                                                        : EXECUTION_HISTORY_EDITOR_OPTIONS
                                                }
                                                style={WORKSPACE_EDITOR_STYLE}
                                                onLoad={(
                                                    editor: Ace.Editor,
                                                ) => {
                                                    editor.selection.moveCursorTo(
                                                        0,
                                                        0,
                                                    );
                                                    editor.clearSelection();
                                                    editor.renderer.scrollToY(
                                                        0,
                                                    );
                                                }}
                                                editorProps={
                                                    WORKSPACE_EDITOR_PROPS
                                                }
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
                                                    onClick={
                                                        handleRetryEditorLoad
                                                    }
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
                        ) : (
                            <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6">
                                <div className="max-w-xs text-center">
                                    <p className="text-xs font-semibold text-fumi-900">
                                        Select an execution
                                    </p>
                                    <p className="mt-1.5 text-[10px] leading-relaxed text-fumi-500">
                                        Pick an entry from the list to inspect
                                        or replay
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
