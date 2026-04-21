import { type DragDropEventHandlers, DragDropProvider } from "@dnd-kit/react";
import { Add01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import { useHotkey } from "@tanstack/react-hotkeys";
import {
    type ReactElement,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import emptyTabIcon from "../../assets/icons/empty_tab.svg";
import {
    SPLIT_DROP_IDS,
    TAB_BAR_MODIFIERS,
    TAB_BAR_SENSORS,
} from "../../constants/workspace/workspace";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWindowResume } from "../../hooks/shared/useWindowResume";
import { useWorkspaceCodeCompletion } from "../../hooks/workspace/useWorkspaceCodeCompletion";
import { useWorkspaceLuauAnalysis } from "../../hooks/workspace/useWorkspaceLuauAnalysis";
import { useWorkspaceStore } from "../../hooks/workspace/useWorkspaceStore";
import { useWorkspaceTabRename } from "../../hooks/workspace/useWorkspaceTabRename";
import type {
    RobloxAccountIdentity,
    RobloxProcessInfo,
} from "../../lib/accounts/accounts.type";
import {
    getAppHotkeyBinding,
    getAppHotkeyShortcutLabel,
} from "../../lib/app/hotkeys";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import {
    getLiveRobloxAccount,
    killRobloxProcess,
    killRobloxProcesses,
    launchRoblox,
    listRobloxProcesses,
} from "../../lib/platform/accounts";
import { confirmAction } from "../../lib/platform/dialog";
import { isTauriEnvironment } from "../../lib/platform/runtime";
import type { WorkspaceOutlineChange } from "../../lib/workspace/outline.type";
import {
    normalizeWorkspaceSplitRatio,
    shouldCloseWorkspaceSplitView,
} from "../../lib/workspace/splitView";
import type { WorkspacePaneId } from "../../lib/workspace/workspace.type";
import { WorkspaceEditor } from "./WorkspaceEditor";
import { WorkspaceErrorBanner } from "./WorkspaceErrorBanner";
import { WorkspaceExecutionHistoryModal } from "./WorkspaceExecutionHistoryModal";
import { WorkspaceExecutorOutputPanel } from "./WorkspaceExecutorOutputPanel";
import { WorkspaceMessageState } from "./WorkspaceMessageState";
import { WorkspaceTabBar } from "./WorkspaceTabBar";
import type { WorkspaceScreenProps } from "./workspaceScreen.type";

/**
 * The main workspace screen containing tabs, editor, and split view.
 *
 * @param props - Component props
 * @param props.session - Workspace session state and actions
 * @param props.executor - Executor state and actions
 * @returns A React component
 */
export function WorkspaceScreen({
    session,
    executor,
    executionHistoryModal,
}: WorkspaceScreenProps): ReactElement {
    const appTheme = useAppStore((state) => state.theme);
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const isCommandPaletteOpen = useAppStore(
        (state) => state.isCommandPaletteOpen,
    );
    const editorSettings = useAppStore((state) => state.editorSettings);
    const setOutlinePanelWidth = useAppStore(
        (state) => state.setOutlinePanelWidth,
    );
    const middleClickTabAction = useAppStore(
        (state) => state.workspaceSettings.middleClickTabAction,
    );
    const renameCurrentTabRequest = useAppStore(
        (state) => state.renameCurrentTabRequest,
    );
    const clearRenameCurrentTabRequest = useAppStore(
        (state) => state.clearRenameCurrentTabRequest,
    );
    const toggleOutlinePanel = useAppStore((state) => state.toggleOutlinePanel);
    const setOutlineExpandedGroups = useAppStore(
        (state) => state.setOutlineExpandedGroups,
    );
    const setOutlineSearchQuery = useAppStore(
        (state) => state.setOutlineSearchQuery,
    );
    const sidebarPosition = useAppStore((state) => state.sidebarPosition);
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
    const { executeHistoryEntry } = executor.actions;

    const [robloxProcesses, setRobloxProcesses] = useState<
        readonly RobloxProcessInfo[]
    >([]);
    const [liveRobloxAccount, setLiveRobloxAccount] =
        useState<RobloxAccountIdentity | null>(null);
    const [isLaunching, setIsLaunching] = useState(false);
    const [isKillingRoblox, setIsKillingRoblox] = useState(false);
    const robloxProcessesRequestIdRef = useRef(0);
    const liveRobloxAccountRequestIdRef = useRef(0);
    const isDesktopShell = isTauriEnvironment();
    const launchRobloxHotkey = getAppHotkeyBinding(
        "LAUNCH_ROBLOX",
        hotkeyBindings,
    );
    const killRobloxHotkey = getAppHotkeyBinding("KILL_ROBLOX", hotkeyBindings);
    const toggleOutlinePanelHotkey = getAppHotkeyBinding(
        "TOGGLE_OUTLINE_PANEL",
        hotkeyBindings,
    );

    const refreshRobloxProcesses = useCallback(async (): Promise<void> => {
        const requestId = robloxProcessesRequestIdRef.current + 1;
        robloxProcessesRequestIdRef.current = requestId;

        try {
            const processes = await listRobloxProcesses();

            if (robloxProcessesRequestIdRef.current === requestId) {
                setRobloxProcesses(processes);
            }
        } catch {}
    }, []);

    useWindowResume(
        () => {
            void refreshRobloxProcesses();
        },
        {
            triggerOnMount: true,
        },
    );

    const refreshLiveRobloxAccount = useCallback(async (): Promise<void> => {
        const requestId = liveRobloxAccountRequestIdRef.current + 1;
        liveRobloxAccountRequestIdRef.current = requestId;

        try {
            const account = await getLiveRobloxAccount();

            if (liveRobloxAccountRequestIdRef.current === requestId) {
                setLiveRobloxAccount(account);
            }
        } catch {
            if (liveRobloxAccountRequestIdRef.current === requestId) {
                setLiveRobloxAccount(null);
            }
        }
    }, []);

    useEffect(() => {
        if (robloxProcesses.length > 0) {
            return;
        }

        liveRobloxAccountRequestIdRef.current += 1;
        setLiveRobloxAccount(null);
    }, [robloxProcesses.length]);

    useWindowResume(
        () => {
            void refreshLiveRobloxAccount();
        },
        {
            isEnabled: robloxProcesses.length > 0,
            triggerOnMount: robloxProcesses.length > 0,
        },
    );

    const handleLaunchRoblox = async (): Promise<void> => {
        if (isLaunching) {
            return;
        }
        setIsLaunching(true);
        try {
            await launchRoblox();
        } finally {
            setIsLaunching(false);
            void refreshRobloxProcesses();
        }
    };

    const handleKillRoblox = async (): Promise<void> => {
        if (isKillingRoblox) {
            return;
        }
        setIsKillingRoblox(true);
        try {
            await killRobloxProcesses();
        } finally {
            setIsKillingRoblox(false);
            void refreshRobloxProcesses();
        }
    };

    const handleKillRobloxProcess = async (pid: number): Promise<void> => {
        await killRobloxProcess(pid);
        void refreshRobloxProcesses();
    };

    const handleConfirmKillRoblox = async (): Promise<void> => {
        const shouldKillRoblox = await confirmAction(
            "Attempt to close Roblox?",
        );

        if (!shouldKillRoblox) {
            return;
        }

        await handleKillRoblox();
    };

    useHotkey(
        launchRobloxHotkey,
        () => {
            void handleLaunchRoblox();
        },
        {
            enabled: isDesktopShell && !isCommandPaletteOpen && !isLaunching,
        },
    );

    useHotkey(
        killRobloxHotkey,
        () => {
            void handleConfirmKillRoblox();
        },
        {
            enabled:
                isDesktopShell && !isCommandPaletteOpen && !isKillingRoblox,
        },
    );

    useHotkey(
        toggleOutlinePanelHotkey,
        () => {
            toggleOutlinePanel();
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    const activeEditorMode = activeTab
        ? getEditorModeForFileName(activeTab.fileName)
        : "text";
    const activeTabId = activeTab?.id ?? null;
    const [latestLuauChangeState, setLatestLuauChangeState] = useState<{
        change: WorkspaceOutlineChange | null;
        tabId: string;
    } | null>(null);
    const latestLuauChange =
        activeTabId && latestLuauChangeState?.tabId === activeTabId
            ? latestLuauChangeState.change
            : null;
    const { analysis: activeLuauAnalysis, symbols: luauSymbols } =
        useWorkspaceLuauAnalysis(
            activeTab,
            editorSettings.isIntellisenseEnabled ||
                editorSettings.isOutlinePanelVisible,
            latestLuauChange,
        );
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
        createHandleEditorUnmount,
        createHandleScroll,
        handleCompletionHover,
        searchPanel,
        goToLine,
    } = useWorkspaceCodeCompletion({
        activeEditorMode,
        activeLuauAnalysis,
        activeTabId,
        tabs: workspace?.tabs ?? [],
        isIntellisenseEnabled: editorSettings.isIntellisenseEnabled,
        intellisensePriority: editorSettings.intellisensePriority,
        intellisenseWidth: editorSettings.intellisenseWidth,
        saveActiveWorkspaceTab,
        updateActiveTabContent,
        updateActiveTabCursor,
        updateActiveTabScrollTop,
    });
    const handleActiveTabLuauChange = useCallback(
        (change: WorkspaceOutlineChange | null): void => {
            if (!activeTabId) {
                return;
            }

            setLatestLuauChangeState({
                change,
                tabId: activeTabId,
            });
        },
        [activeTabId],
    );

    const splitView = workspace?.splitView ?? null;
    const [isTabDragActive, setIsTabDragActive] = useState(false);
    const [splitRatioPreview, setSplitRatioPreview] = useState<number | null>(
        null,
    );
    const [splitDropTarget, setSplitDropTarget] =
        useState<WorkspacePaneId | null>(null);
    const lastDropTargetTabIdRef = useRef<string | null>(null);
    const draggedTabIdRef = useRef<string | null>(null);

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
                return;
            }

            if (targetId === "workspace-split-right") {
                setSplitDropTarget("secondary");
                return;
            }

            setSplitDropTarget(null);

            if (typeof targetId !== "string" || draggedTabId === targetId) {
                return;
            }

            lastDropTargetTabIdRef.current = targetId;

            if (!workspace) {
                return;
            }
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
        },
        [],
    );

    const handleDragEnd: DragDropEventHandlers["onDragEnd"] = useCallback(
        ({ canceled, operation }): void => {
            const draggedTabId = draggedTabIdRef.current;
            draggedTabIdRef.current = null;
            setIsTabDragActive(false);

            const resolvedSplitTarget = splitDropTarget;
            setSplitDropTarget(null);
            if (canceled || !draggedTabId) {
                lastDropTargetTabIdRef.current = null;
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
                        previewTabs={workspace.tabs}
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
                                    ? undefined
                                    : undefined
                            }
                            description={
                                workspace.archivedTabs.length > 0
                                    ? "Restore archived tabs from Settings, or create a new file to keep working."
                                    : "Scripts are stored directly in this workspace directory. Create a file, then edit it in the editor."
                            }
                            illustrationUrl={emptyTabIcon}
                            action={createFileAction}
                        />
                    ) : activeTab ? (
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="relative flex min-h-0 flex-1">
                                <WorkspaceEditor
                                    activeTabId={activeTab.id}
                                    appTheme={appTheme}
                                    editorFontSize={editorSettings.fontSize}
                                    isWordWrapEnabled={
                                        editorSettings.isWordWrapEnabled
                                    }
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
                                    createHandleEditorLoad={
                                        createHandleEditorLoad
                                    }
                                    createHandleEditorUnmount={
                                        createHandleEditorUnmount
                                    }
                                    createHandleScroll={createHandleScroll}
                                    handleCompletionHover={
                                        handleCompletionHover
                                    }
                                    isOutlinePanelVisible={
                                        editorSettings.isOutlinePanelVisible
                                    }
                                    sidebarPosition={sidebarPosition}
                                    luauSymbols={luauSymbols}
                                    outlinePanelWidth={
                                        editorSettings.outlinePanelWidth
                                    }
                                    outlineExpandedGroups={
                                        editorSettings.outlineExpandedGroups
                                    }
                                    onToggleExpandedGroup={(title) => {
                                        setOutlineExpandedGroups({
                                            [title]:
                                                !editorSettings
                                                    .outlineExpandedGroups[
                                                    title
                                                ],
                                        });
                                    }}
                                    onExpandAllGroups={(titles) => {
                                        setOutlineExpandedGroups(
                                            Object.fromEntries(
                                                titles.map((t) => [t, true]),
                                            ),
                                        );
                                    }}
                                    onCollapseAllGroups={(titles) => {
                                        setOutlineExpandedGroups(
                                            Object.fromEntries(
                                                titles.map((t) => [t, false]),
                                            ),
                                        );
                                    }}
                                    outlineSearchQuery={
                                        editorSettings.outlineSearchQuery
                                    }
                                    onOutlineSearchQueryChange={
                                        setOutlineSearchQuery
                                    }
                                    onActiveTabLuauChange={
                                        handleActiveTabLuauChange
                                    }
                                    onFocusPane={focusWorkspacePane}
                                    onSetOutlinePanelWidth={
                                        setOutlinePanelWidth
                                    }
                                    onResizeSplitPreview={
                                        handleResizeSplitPreview
                                    }
                                    onResizeSplitCommit={
                                        handleResizeSplitCommit
                                    }
                                    onResizeSplitCancel={
                                        handleResizeSplitCancel
                                    }
                                    goToLine={goToLine}
                                    workspaceActionsButton={{
                                        executor,
                                        isLaunching,
                                        onLaunchRoblox: handleLaunchRoblox,
                                        isKillingRoblox,
                                        onKillRoblox: handleKillRoblox,
                                        isOutlinePanelVisible:
                                            editorSettings.isOutlinePanelVisible,
                                        onToggleOutlinePanel:
                                            toggleOutlinePanel,
                                        robloxProcesses,
                                        liveRobloxAccount,
                                        onKillRobloxProcess:
                                            handleKillRobloxProcess,
                                        onOpenExecutionHistory:
                                            executionHistoryModal.onOpen,
                                    }}
                                />
                            </div>
                            <WorkspaceExecutorOutputPanel
                                isAttached={executorState.isAttached}
                                messages={executorState.recentMessages}
                                onClear={executor.actions.clearRecentMessages}
                            />
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
            <WorkspaceExecutionHistoryModal
                isOpen={executionHistoryModal.isOpen}
                entries={workspace?.executionHistory ?? []}
                onClose={executionHistoryModal.onClose}
                onReRun={executeHistoryEntry}
            />
        </section>
    );
}
