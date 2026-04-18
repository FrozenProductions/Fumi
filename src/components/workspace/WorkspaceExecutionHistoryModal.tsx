import {
    Calendar01Icon,
    Copy01Icon,
    Key01Icon,
    PlayIcon,
    Tick01Icon,
    UserIcon,
} from "@hugeicons/core-free-icons";
import type { Ace } from "ace-builds";
import { type ReactElement, useEffect, useRef, useState } from "react";
import {
    WORKSPACE_EDITOR_OPTIONS,
    WORKSPACE_EDITOR_PROPS,
    WORKSPACE_EDITOR_STYLE,
} from "../../constants/workspace/editor";
import { useAppStore } from "../../hooks/app/useAppStore";
import { loadAceRuntime } from "../../lib/luau/loadAceRuntime";
import type { LoadedAceRuntime } from "../../lib/luau/loadAceRuntime.type";
import { copyTextToClipboard } from "../../lib/platform/clipboard";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import { getReactAceComponent } from "../../lib/workspace/editor";
import type { AceEditorComponent } from "../../lib/workspace/editor.type";
import { shouldUsePlainTextExecutionHistoryPreview } from "../../lib/workspace/executionHistory";
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
    const [AceEditorComp, setAceEditorComp] =
        useState<AceEditorComponent | null>(null);
    const [aceRuntime, setAceRuntime] = useState<LoadedAceRuntime | null>(null);
    const editorRef = useRef<Ace.Editor | null>(null);
    const appliedEntryIdRef = useRef<string | null>(null);
    const selectedEntry =
        entries.find((entry) => entry.id === selectedEntryId) ??
        entries[0] ??
        null;
    const shouldUsePlainTextPreview =
        selectedEntry !== null &&
        shouldUsePlainTextExecutionHistoryPreview(selectedEntry.scriptContent);

    useEffect(() => {
        if (!isOpen) {
            setFeedbackMessage(null);
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
        if (!isOpen || shouldUsePlainTextPreview) {
            editorRef.current = null;
            appliedEntryIdRef.current = selectedEntryId;
            return;
        }

        const editor = editorRef.current;

        if (!editor || !selectedEntryId) {
            appliedEntryIdRef.current = selectedEntryId;
            return;
        }

        if (appliedEntryIdRef.current === selectedEntryId) {
            return;
        }

        appliedEntryIdRef.current = selectedEntryId;
        editor.selection.moveCursorTo(0, 0);
        editor.clearSelection();
        editor.renderer.scrollToY(0);
    }, [isOpen, selectedEntryId, shouldUsePlainTextPreview]);

    useEffect(() => {
        if (
            !isOpen ||
            shouldUsePlainTextPreview ||
            (AceEditorComp !== null && aceRuntime !== null)
        ) {
            return;
        }

        let isMounted = true;

        void (async () => {
            const loadedAceRuntime = await loadAceRuntime();
            const reactAceModule = await import("react-ace");
            const reactAceComponent = getReactAceComponent(reactAceModule);

            if (!isMounted) {
                return;
            }

            setAceRuntime(loadedAceRuntime);
            setAceEditorComp(() => reactAceComponent);
        })();

        return () => {
            isMounted = false;
        };
    }, [AceEditorComp, aceRuntime, isOpen, shouldUsePlainTextPreview]);

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
                        {entries.length > 0 ? (
                            <div className="min-h-0 flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar-thumb:hover]:bg-[rgb(var(--color-scrollbar-thumb-hover)/1)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[rgb(var(--color-scrollbar-thumb)/1)] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar]:w-[6px]">
                                <div className="flex flex-col gap-0.5">
                                    {entries.map((entry) => {
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
                                                {formatExecutionTimestamp(selectedEntry.executedAt)}
                                                {" · "}
                                                {formatExecutorKind(selectedEntry.executorKind)}
                                                {" · Port "}{selectedEntry.port}
                                                {" · "}
                                                {formatAccountLabel(selectedEntry)}
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
                                    {shouldUsePlainTextPreview ? (
                                        <div className="flex h-full min-h-0 flex-col">
                                            <div className="shrink-0 border-b border-fumi-200 px-4 py-1.5">
                                                <p className="text-[10px] font-semibold text-fumi-500">
                                                    Large snapshot loaded in
                                                    plain-text mode to keep the
                                                    app responsive.
                                                </p>
                                            </div>
                                            <div className="min-h-0 flex-1 bg-fumi-50">
                                                <textarea
                                                    key={selectedEntry.id}
                                                    readOnly
                                                    defaultValue={
                                                        selectedEntry.scriptContent
                                                    }
                                                    spellCheck={false}
                                                    wrap="off"
                                                    className="h-full w-full resize-none border-0 bg-fumi-50 px-4 py-3 text-fumi-900 outline-none"
                                                    style={{
                                                        ...WORKSPACE_EDITOR_STYLE,
                                                        fontSize: Math.max(
                                                            editorFontSize - 2,
                                                            10,
                                                        ),
                                                        lineHeight: 1.55,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : AceEditorComp && aceRuntime ? (
                                        <AceEditorComp
                                            className="workspace-ace-editor"
                                            name={`execution-history-editor-${selectedEntry.id}`}
                                            value={selectedEntry.scriptContent}
                                            mode={aceRuntime.getMode(
                                                selectedEntry.fileName,
                                            )}
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
                                            enableBasicAutocompletion={false}
                                            enableLiveAutocompletion={false}
                                            enableSnippets={false}
                                            showGutter
                                            showPrintMargin={false}
                                            tabSize={4}
                                            wrapEnabled={false}
                                            setOptions={{
                                                ...WORKSPACE_EDITOR_OPTIONS,
                                                scrollPastEnd: false,
                                            }}
                                            style={WORKSPACE_EDITOR_STYLE}
                                            onLoad={(editor: Ace.Editor) => {
                                                editorRef.current = editor;
                                                appliedEntryIdRef.current =
                                                    selectedEntry.id;
                                                editor.selection.moveCursorTo(
                                                    0,
                                                    0,
                                                );
                                                editor.clearSelection();
                                                editor.renderer.scrollToY(0);
                                            }}
                                            editorProps={WORKSPACE_EDITOR_PROPS}
                                        />
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
