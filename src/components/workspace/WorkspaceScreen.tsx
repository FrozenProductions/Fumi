import { type DragDropEventHandlers, DragDropProvider } from "@dnd-kit/react";
import {
    Add01Icon,
    FolderOpenIcon,
    PlayIcon,
} from "@hugeicons/core-free-icons";
import {
    type ReactElement,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWorkspaceCodeCompletion } from "../../hooks/workspace/useWorkspaceCodeCompletion";
import { useWorkspaceStore } from "../../hooks/workspace/useWorkspaceStore";
import { useWorkspaceTabRename } from "../../hooks/workspace/useWorkspaceTabRename";
import { getAppHotkeyShortcutLabel } from "../../lib/app/hotkeys";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import {
    normalizeWorkspaceSplitRatio,
    shouldCloseWorkspaceSplitView,
} from "../../lib/workspace/splitView";
import {
    reorderTabPreview,
    TAB_BAR_MODIFIERS,
    TAB_BAR_SENSORS,
} from "../../lib/workspace/tabBar";
import type { WorkspacePaneId } from "../../lib/workspace/workspace.type";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import { WorkspaceEditor } from "./WorkspaceEditor";
import { WorkspaceErrorBanner } from "./WorkspaceErrorBanner";
import { WorkspaceMessageState } from "./WorkspaceMessageState";
import { WorkspaceTabBar } from "./WorkspaceTabBar";
import type { WorkspaceScreenProps } from "./workspaceScreen.type";

const SPLIT_DROP_IDS = new Set([
    "workspace-split-left",
    "workspace-split-right",
]);

export function WorkspaceScreen({
    session,
    executor,
}: WorkspaceScreenProps): ReactElement {
    const appTheme = useAppStore((state) => state.theme);
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const editorSettings = useAppStore((state) => state.editorSettings);
    const middleClickTabAction = useAppStore(
        (state) => state.workspaceSettings.middleClickTabAction,
    );
    const renameCurrentTabRequest = useAppStore(
        (state) => state.renameCurrentTabRequest,
    );
    const clearRenameCurrentTabRequest = useAppStore(
        (state) => state.clearRenameCurrentTabRequest,
    );
    const persistWorkspaceState = useWorkspaceStore(
        (state) => state.persistWorkspaceState,
    );
    const {
        activeTab,
        activeTabIndex,
        errorMessage,
        isBootstrapping,
        workspace,
    } = session.state;
    const { createWorkspaceFile, openWorkspaceDirectory } =
        session.workspaceActions;
    const {
        archiveWorkspaceTab,
        deleteWorkspaceTab,
        duplicateWorkspaceTab,
        renameWorkspaceTab,
        reorderWorkspaceTab,
        saveActiveWorkspaceTab,
        selectWorkspaceTab,
        openWorkspaceTabInPane,
        setWorkspaceSplitRatio,
        focusWorkspacePane,
        closeWorkspaceSplitView,
    } = session.tabActions;
    const {
        updateActiveTabContent,
        updateActiveTabCursor,
        updateActiveTabScrollTop,
    } = session.editorActions;
    const executorState = executor.state;
    const { executeActiveTab } = executor.actions;
    const activeEditorMode = activeTab
        ? getEditorModeForFileName(activeTab.fileName)
        : "text";
    const renameState = useWorkspaceTabRename({
        workspace,
        renameWorkspaceTab,
        selectWorkspaceTab,
    });
    const { handleStartRename } = renameState;
    const {
        acceptCompletion,
        completionPopup,
        createHandleCursorChange,
        createHandleEditorChange,
        createHandleEditorLoad,
        createHandleScroll,
        handleCompletionHover,
        searchPanel,
    } = useWorkspaceCodeCompletion({
        activeEditorMode,
        activeTabId: activeTab?.id ?? null,
        tabs: workspace?.tabs ?? [],
        isIntellisenseEnabled: editorSettings.isIntellisenseEnabled,
        intellisensePriority: editorSettings.intellisensePriority,
        intellisenseWidth: editorSettings.intellisenseWidth,
        saveActiveWorkspaceTab,
        updateActiveTabContent,
        updateActiveTabCursor,
        updateActiveTabScrollTop,
    });

    const splitView = workspace?.splitView ?? null;
    const [previewTabs, setPreviewTabs] = useState(workspace?.tabs ?? []);
    const [isTabDragActive, setIsTabDragActive] = useState(false);
    const [splitRatioPreview, setSplitRatioPreview] = useState<number | null>(
        null,
    );
    const [splitDropTarget, setSplitDropTarget] =
        useState<WorkspacePaneId | null>(null);
    const lastDropTargetTabIdRef = useRef<string | null>(null);
    const lastPreviewTargetTabIdRef = useRef<string | null>(null);
    const draggedTabIdRef = useRef<string | null>(null);

    useEffect(() => {
        setPreviewTabs(workspace?.tabs ?? []);
    }, [workspace?.tabs]);

    useEffect(() => {
        if (!splitView) {
            setSplitRatioPreview(null);
        }
    }, [splitView]);

    const resolvedSplitView =
        splitView && splitRatioPreview !== null
            ? {
                  ...splitView,
                  splitRatio: splitRatioPreview,
              }
            : splitView;

    const handleDragOver: DragDropEventHandlers["onDragOver"] = useCallback(
        ({ operation }): void => {
            const draggedTabId = operation.source?.id;
            const targetId = operation.target?.id;

            if (typeof draggedTabId !== "string") {
                return;
            }

            if (targetId === "workspace-split-left") {
                setSplitDropTarget("primary");
                lastPreviewTargetTabIdRef.current = null;
                return;
            }

            if (targetId === "workspace-split-right") {
                setSplitDropTarget("secondary");
                lastPreviewTargetTabIdRef.current = null;
                return;
            }

            setSplitDropTarget(null);

            if (typeof targetId !== "string" || draggedTabId === targetId) {
                return;
            }

            if (lastPreviewTargetTabIdRef.current === targetId) {
                return;
            }

            lastDropTargetTabIdRef.current = targetId;
            lastPreviewTargetTabIdRef.current = targetId;

            if (!workspace) {
                return;
            }

            setPreviewTabs(
                reorderTabPreview(workspace.tabs, draggedTabId, targetId),
            );
        },
        [workspace],
    );

    const handleDragStart: DragDropEventHandlers["onDragStart"] = useCallback(
        ({ operation }): void => {
            const tabId = operation.source?.id;
            draggedTabIdRef.current = typeof tabId === "string" ? tabId : null;
            setIsTabDragActive(true);
            setSplitDropTarget(null);
            lastDropTargetTabIdRef.current = null;
            lastPreviewTargetTabIdRef.current = null;

            if (workspace) {
                setPreviewTabs(workspace.tabs);
            }
        },
        [workspace],
    );

    const handleDragEnd: DragDropEventHandlers["onDragEnd"] = useCallback(
        ({ canceled, operation }): void => {
            const draggedTabId = draggedTabIdRef.current;
            draggedTabIdRef.current = null;
            setIsTabDragActive(false);

            const resolvedSplitTarget = splitDropTarget;
            setSplitDropTarget(null);
            lastPreviewTargetTabIdRef.current = null;

            if (canceled || !draggedTabId) {
                lastDropTargetTabIdRef.current = null;
                if (workspace) {
                    setPreviewTabs(workspace.tabs);
                }
                return;
            }

            if (resolvedSplitTarget) {
                lastDropTargetTabIdRef.current = null;
                openWorkspaceTabInPane(draggedTabId, resolvedSplitTarget);
                return;
            }

            const rawTargetTabId = operation.target?.id;
            const targetTabId =
                typeof rawTargetTabId === "string" &&
                rawTargetTabId !== draggedTabId &&
                !SPLIT_DROP_IDS.has(rawTargetTabId)
                    ? rawTargetTabId
                    : lastDropTargetTabIdRef.current;

            lastDropTargetTabIdRef.current = null;

            if (
                typeof draggedTabId !== "string" ||
                typeof targetTabId !== "string"
            ) {
                if (workspace) {
                    setPreviewTabs(workspace.tabs);
                }
                return;
            }

            if (splitView) {
                const secondaryTabIdSet = new Set(splitView.secondaryTabIds);
                const draggedIsSecondary = secondaryTabIdSet.has(draggedTabId);
                const targetIsSecondary = secondaryTabIdSet.has(targetTabId);

                if (draggedIsSecondary && !targetIsSecondary) {
                    openWorkspaceTabInPane(draggedTabId, "primary");
                    return;
                }

                if (!draggedIsSecondary && targetIsSecondary) {
                    openWorkspaceTabInPane(draggedTabId, "secondary");
                    return;
                }
            }

            reorderWorkspaceTab(draggedTabId, targetTabId);
        },
        [
            openWorkspaceTabInPane,
            reorderWorkspaceTab,
            splitDropTarget,
            splitView,
            workspace,
        ],
    );

    const handleOpenWorkspaceDirectory = (): void => {
        void openWorkspaceDirectory();
    };

    const handleCreateWorkspaceFile = (): void => {
        void createWorkspaceFile();
    };

    const handleArchiveWorkspaceTab = (tabId: string): void => {
        void archiveWorkspaceTab(tabId);
    };

    const handleDuplicateWorkspaceTab = (tabId: string): void => {
        void duplicateWorkspaceTab(tabId);
    };

    const handleDeleteWorkspaceTab = (tabId: string): void => {
        void deleteWorkspaceTab(tabId);
    };

    const handleResizeSplitPreview = useCallback((splitRatio: number): void => {
        setSplitRatioPreview(normalizeWorkspaceSplitRatio(splitRatio));
    }, []);

    const handleResizeSplitCancel = useCallback((): void => {
        setSplitRatioPreview(null);
    }, []);

    const handleResizeSplitCommit = useCallback(
        (splitRatio: number): void => {
            setSplitRatioPreview(null);

            if (!splitView) {
                return;
            }

            if (shouldCloseWorkspaceSplitView(splitRatio)) {
                closeWorkspaceSplitView();
                return;
            }

            setWorkspaceSplitRatio(normalizeWorkspaceSplitRatio(splitRatio));
            void persistWorkspaceState();
        },
        [
            closeWorkspaceSplitView,
            persistWorkspaceState,
            setWorkspaceSplitRatio,
            splitView,
        ],
    );

    useEffect(() => {
        if (!renameCurrentTabRequest || !activeTab) {
            return;
        }

        handleStartRename(activeTab.id, activeTab.fileName);
        clearRenameCurrentTabRequest();
    }, [
        activeTab,
        clearRenameCurrentTabRequest,
        handleStartRename,
        renameCurrentTabRequest,
    ]);

    const executeButtonClassName =
        appTheme === "dark"
            ? "pointer-events-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-[0.5rem] border border-fumi-300 bg-fumi-700 px-3.5 text-xs font-semibold tracking-wide text-fumi-50 shadow-sm transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-400 hover:bg-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
            : "pointer-events-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-[0.5rem] border border-fumi-200 bg-fumi-600 px-3.5 text-xs font-semibold tracking-wide text-white shadow-sm transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50";
    const chooseWorkspaceAction = {
        label: "Choose workspace",
        onClick: handleOpenWorkspaceDirectory,
        icon: FolderOpenIcon,
    };
    const createFileAction = {
        label: "New file",
        onClick: handleCreateWorkspaceFile,
        icon: Add01Icon,
        shortcut: getAppHotkeyShortcutLabel(
            "CREATE_WORKSPACE_FILE",
            hotkeyBindings,
        ),
    };

    if (isBootstrapping) {
        return (
            <section className="flex h-full min-h-0 flex-col bg-gradient-to-br from-fumi-50 via-fumi-50 to-fumi-100/80">
                <WorkspaceMessageState
                    eyebrow="Loading workspace"
                    title="Restoring your last session"
                    description="Fumi is reconnecting your workspace and editor tabs."
                />
            </section>
        );
    }

    if (!workspace) {
        return (
            <section className="flex h-full min-h-0 flex-col bg-gradient-to-br from-fumi-50 via-fumi-50 to-fumi-100/80">
                {errorMessage ? (
                    <WorkspaceErrorBanner errorMessage={errorMessage} />
                ) : null}
                {executorState.errorMessage ? (
                    <WorkspaceErrorBanner
                        errorMessage={executorState.errorMessage}
                    />
                ) : null}
                <WorkspaceMessageState
                    eyebrow="Workspace"
                    title="Choose a folder to store scripts"
                    description="Pick a folder where you want to keep your scripts. You can change it later from the workspace button in the top bar."
                    action={chooseWorkspaceAction}
                />
            </section>
        );
    }

    return (
        <section className="flex h-full min-h-0 flex-col bg-fumi-50">
            {errorMessage ? (
                <WorkspaceErrorBanner errorMessage={errorMessage} />
            ) : null}
            {executorState.errorMessage ? (
                <WorkspaceErrorBanner
                    errorMessage={executorState.errorMessage}
                />
            ) : null}
            <DragDropProvider
                modifiers={TAB_BAR_MODIFIERS}
                sensors={TAB_BAR_SENSORS}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {workspace.tabs.length > 0 ? (
                    <WorkspaceTabBar
                        workspace={workspace}
                        splitView={resolvedSplitView}
                        renameState={renameState}
                        previewTabs={previewTabs}
                        isTabDragActive={isTabDragActive}
                        splitDropTarget={splitDropTarget}
                        onCreateFile={handleCreateWorkspaceFile}
                        onSelectTab={selectWorkspaceTab}
                        onDuplicateTab={handleDuplicateWorkspaceTab}
                        onArchiveTab={handleArchiveWorkspaceTab}
                        onDeleteTab={handleDeleteWorkspaceTab}
                        onOpenTabInPane={openWorkspaceTabInPane}
                        onCloseSplitView={closeWorkspaceSplitView}
                        middleClickTabAction={middleClickTabAction}
                        onDragPreview={() => {}}
                        onDragStart={() => {}}
                        onDragEnd={() => {}}
                    />
                ) : null}

                <div className="flex min-h-0 flex-1 flex-col">
                    {workspace.tabs.length === 0 ? (
                        <WorkspaceMessageState
                            eyebrow={
                                workspace.archivedTabs.length > 0
                                    ? "Archived tabs"
                                    : "Empty workspace"
                            }
                            title={
                                workspace.archivedTabs.length > 0
                                    ? "All tabs are archived"
                                    : "Create your first script file"
                            }
                            description={
                                workspace.archivedTabs.length > 0
                                    ? "Restore archived tabs from Settings, or create a new file to keep working."
                                    : "Scripts are stored directly in this workspace directory. Create a file, then edit it in the editor."
                            }
                            action={createFileAction}
                        />
                    ) : activeTab ? (
                        <div className="relative flex min-h-0 flex-1">
                            <WorkspaceEditor
                                activeTabId={activeTab.id}
                                appTheme={appTheme}
                                editorFontSize={editorSettings.fontSize}
                                tabs={workspace.tabs}
                                splitView={resolvedSplitView}
                                searchPanel={searchPanel}
                                acceptCompletion={acceptCompletion}
                                completionPopup={completionPopup}
                                createHandleCursorChange={
                                    createHandleCursorChange
                                }
                                createHandleEditorChange={
                                    createHandleEditorChange
                                }
                                createHandleEditorLoad={createHandleEditorLoad}
                                createHandleScroll={createHandleScroll}
                                handleCompletionHover={handleCompletionHover}
                                onFocusPane={focusWorkspacePane}
                                onResizeSplitPreview={handleResizeSplitPreview}
                                onResizeSplitCommit={handleResizeSplitCommit}
                                onResizeSplitCancel={handleResizeSplitCancel}
                            />
                            <div className="pointer-events-none absolute bottom-5 right-5 z-20">
                                <AppTooltip
                                    content={
                                        !executorState.hasSupportedExecutor
                                            ? "No supported executor detected."
                                            : executorState.isAttached
                                              ? "Execute the current tab through the executor"
                                              : "Attach to an executor port before executing"
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void executeActiveTab();
                                        }}
                                        disabled={
                                            executorState.isBusy ||
                                            !executorState.hasSupportedExecutor
                                        }
                                        className={`app-select-none ${executeButtonClassName} ${
                                            executorState.isBusy
                                                ? "cursor-wait opacity-70"
                                                : !executorState.hasSupportedExecutor
                                                  ? "cursor-not-allowed opacity-60"
                                                  : ""
                                        }`}
                                    >
                                        <AppIcon
                                            icon={PlayIcon}
                                            className={`size-3.5 ${executorState.isBusy ? "opacity-50" : ""}`}
                                            strokeWidth={2.5}
                                        />
                                        {executorState.isBusy
                                            ? "Executing"
                                            : "Execute"}
                                    </button>
                                </AppTooltip>
                            </div>
                        </div>
                    ) : (
                        <WorkspaceMessageState
                            eyebrow="Workspace ready"
                            title="Select a tab to start editing"
                            description={`${workspace.workspaceName} contains ${workspace.tabs.length} registered file${workspace.tabs.length === 1 ? "" : "s"}.`}
                        />
                    )}
                </div>
            </DragDropProvider>
            {workspace.tabs.length === 0 ? (
                <div className="sr-only" aria-live="polite">
                    No active tab
                </div>
            ) : (
                <div className="sr-only" aria-live="polite">
                    {activeTabIndex >= 0 && activeTab
                        ? `${activeTab.fileName} open`
                        : "No active tab"}
                </div>
            )}
        </section>
    );
}
