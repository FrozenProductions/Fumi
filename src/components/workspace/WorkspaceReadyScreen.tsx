import { DragDropProvider } from "@dnd-kit/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo } from "react";
import emptyTabIcon from "../../assets/icons/empty_tab.svg";
import {
    TAB_BAR_MODIFIERS,
    TAB_BAR_SENSORS,
} from "../../constants/workspace/workspace";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWorkspaceTabDragDrop } from "../../hooks/workspace/tabBar/useWorkspaceTabDragDrop";
import { useWorkspaceTabRename } from "../../hooks/workspace/tabBar/useWorkspaceTabRename";
import { useWorkspaceRobloxControls } from "../../hooks/workspace/useWorkspaceRobloxControls";
import { useWorkspaceScreenHotkeys } from "../../hooks/workspace/useWorkspaceScreenHotkeys";
import { useWorkspaceStore } from "../../hooks/workspace/useWorkspaceStore";
import { getAppHotkeyShortcutLabel } from "../../lib/app/hotkeys/hotkeys";
import { selectWorkspaceScreenSession } from "../../lib/workspace/store/selectors";
import { WorkspaceEditorRegion } from "./editor/WorkspaceEditorRegion";
import { WorkspaceExecutionHistoryModal } from "./executionHistory/WorkspaceExecutionHistoryModal";
import { WorkspaceMessageState } from "./feedback/WorkspaceMessageState";
import { WorkspaceTabBar } from "./WorkspaceTabBar";
import type {
    WorkspaceActionsButtonProps,
    WorkspaceActiveTabStatusProps,
    WorkspaceReadyContentProps,
    WorkspaceScreenProps,
} from "./workspaceScreen.type";

/**
 * Composes the main workspace view with tab bar, editor region, and execution history modal.
 *
 * @param props - Component props
 */
export function WorkspaceReadyScreen({
    executor,
    executionHistoryModal,
}: WorkspaceScreenProps): ReactElement | null {
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const isCommandPaletteOpen = useAppStore(
        (state) => state.isCommandPaletteOpen,
    );
    const middleClickTabAction = useAppStore(
        (state) => state.workspaceSettings.middleClickTabAction,
    );
    const isSplitViewArchiveScopeEnabled = useAppStore(
        (state) => state.workspaceSettings.isSplitViewArchiveScopeEnabled,
    );
    const renameCurrentTabRequest = useAppStore(
        (state) => state.renameCurrentTabRequest,
    );
    const clearRenameCurrentTabRequest = useAppStore(
        (state) => state.clearRenameCurrentTabRequest,
    );
    const editorSettings = useAppStore((state) => state.editorSettings);
    const toggleOutlinePanel = useAppStore((state) => state.toggleOutlinePanel);
    const workspace = useWorkspaceStore(selectWorkspaceScreenSession);
    const persistWorkspaceState = useWorkspaceStore(
        (state) => state.persistWorkspaceState,
    );
    const createWorkspaceFile = useWorkspaceStore(
        (state) => state.createWorkspaceFile,
    );
    const archiveWorkspaceTab = useWorkspaceStore(
        (state) => state.archiveWorkspaceTab,
    );
    const archiveAllWorkspaceTabs = useWorkspaceStore(
        (state) => state.archiveAllWorkspaceTabs,
    );
    const archiveOtherWorkspaceTabs = useWorkspaceStore(
        (state) => state.archiveOtherWorkspaceTabs,
    );
    const toggleWorkspaceTabPinned = useWorkspaceStore(
        (state) => state.toggleWorkspaceTabPinned,
    );
    const deleteWorkspaceTab = useWorkspaceStore(
        (state) => state.deleteWorkspaceTab,
    );
    const duplicateWorkspaceTab = useWorkspaceStore(
        (state) => state.duplicateWorkspaceTab,
    );
    const renameWorkspaceTab = useWorkspaceStore(
        (state) => state.renameWorkspaceTab,
    );
    const reorderWorkspaceTab = useWorkspaceStore(
        (state) => state.reorderWorkspaceTab,
    );
    const selectWorkspaceTab = useWorkspaceStore(
        (state) => state.selectWorkspaceTab,
    );
    const splitWorkspaceTab = useWorkspaceStore(
        (state) => state.splitWorkspaceTab,
    );
    const moveWorkspaceTabToPane = useWorkspaceStore(
        (state) => state.moveWorkspaceTabToPane,
    );
    const setWorkspaceSplitRatio = useWorkspaceStore(
        (state) => state.setWorkspaceSplitRatio,
    );
    const closeWorkspaceSplitView = useWorkspaceStore(
        (state) => state.closeWorkspaceSplitView,
    );
    const { executeHistoryEntry } = executor.actions;

    const renameState = useWorkspaceTabRename({
        workspace,
        renameWorkspaceTab,
        selectWorkspaceTab,
    });
    const { handleStartRename } = renameState;
    const activeTab =
        workspace?.tabs.find((tab) => tab.id === workspace.activeTabId) ?? null;
    const activeTabIndex =
        activeTab && workspace
            ? workspace.tabs.findIndex((tab) => tab.id === activeTab.id)
            : -1;
    const splitView = workspace?.splitView ?? null;
    const {
        isDesktopShell,
        robloxProcesses,
        liveRobloxAccount,
        isLaunching,
        isKillingRoblox,
        killingRobloxProcessPid,
        launchRoblox,
        killRoblox,
        confirmAndKillRoblox,
        killRobloxProcess,
    } = useWorkspaceRobloxControls();
    const {
        isTabDragActive,
        resolvedSplitView,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleResizeSplitPreview,
        handleResizeSplitCancel,
        handleResizeSplitCommit,
    } = useWorkspaceTabDragDrop({
        splitView,
        splitWorkspaceTab,
        moveWorkspaceTabToPane,
        reorderWorkspaceTab,
        setWorkspaceSplitRatio,
        persistWorkspaceState,
    });

    useWorkspaceScreenHotkeys({
        hotkeyBindings,
        isCommandPaletteOpen,
        isDesktopShell,
        isLaunching,
        isKillingRoblox,
        killingRobloxProcessPid,
        onLaunchRoblox: launchRoblox,
        onConfirmKillRoblox: confirmAndKillRoblox,
        onToggleOutlinePanel: toggleOutlinePanel,
    });

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

    const handleCreateWorkspaceFile = useCallback((): void => {
        void createWorkspaceFile();
    }, [createWorkspaceFile]);

    const handleArchiveWorkspaceTab = useCallback(
        (tabId: string): void => {
            void archiveWorkspaceTab(tabId);
        },
        [archiveWorkspaceTab],
    );

    const handleArchiveAllWorkspaceTabs = useCallback(
        (scopeTabIds?: readonly string[]): void => {
            void archiveAllWorkspaceTabs(
                scopeTabIds ? { scopeTabIds } : undefined,
            );
        },
        [archiveAllWorkspaceTabs],
    );

    const handleArchiveOtherWorkspaceTabs = useCallback(
        (tabId: string, scopeTabIds?: readonly string[]): void => {
            void archiveOtherWorkspaceTabs(
                tabId,
                scopeTabIds ? { scopeTabIds } : undefined,
            );
        },
        [archiveOtherWorkspaceTabs],
    );

    const handleToggleWorkspaceTabPinned = useCallback(
        (tabId: string): void => {
            toggleWorkspaceTabPinned(tabId);
        },
        [toggleWorkspaceTabPinned],
    );

    const handleDuplicateWorkspaceTab = useCallback(
        (tabId: string): void => {
            void duplicateWorkspaceTab(tabId);
        },
        [duplicateWorkspaceTab],
    );

    const handleDeleteWorkspaceTab = useCallback(
        (tabId: string): void => {
            void deleteWorkspaceTab(tabId);
        },
        [deleteWorkspaceTab],
    );

    const createFileAction = useMemo(
        () => ({
            label: "New file",
            onClick: handleCreateWorkspaceFile,
            icon: Add01Icon,
            shortcut: getAppHotkeyShortcutLabel(
                "CREATE_WORKSPACE_FILE",
                hotkeyBindings,
            ),
        }),
        [handleCreateWorkspaceFile, hotkeyBindings],
    );

    const workspaceActionsButton = useMemo<WorkspaceActionsButtonProps>(
        () => ({
            executor,
            isLaunching,
            onLaunchRoblox: launchRoblox,
            isKillingRoblox,
            killingRobloxProcessPid,
            onKillRoblox: killRoblox,
            isOutlinePanelVisible: editorSettings.isOutlinePanelVisible,
            onToggleOutlinePanel: toggleOutlinePanel,
            robloxProcesses,
            liveRobloxAccount,
            onKillRobloxProcess: killRobloxProcess,
            onOpenExecutionHistory: executionHistoryModal.onOpen,
        }),
        [
            editorSettings.isOutlinePanelVisible,
            executionHistoryModal.onOpen,
            executor,
            isKillingRoblox,
            isLaunching,
            killRoblox,
            killRobloxProcess,
            killingRobloxProcessPid,
            launchRoblox,
            liveRobloxAccount,
            robloxProcesses,
            toggleOutlinePanel,
        ],
    );

    if (!workspace) {
        return null;
    }

    return (
        <section className="flex h-full w-full min-w-0 min-h-0 flex-col overflow-hidden bg-fumi-50">
            <DragDropProvider
                modifiers={TAB_BAR_MODIFIERS}
                sensors={TAB_BAR_SENSORS}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <WorkspaceReadyContent
                    activeTab={activeTab}
                    createFileAction={createFileAction}
                    isSplitViewArchiveScopeEnabled={
                        isSplitViewArchiveScopeEnabled
                    }
                    isTabDragActive={isTabDragActive}
                    middleClickTabAction={middleClickTabAction}
                    renameState={renameState}
                    resolvedSplitView={resolvedSplitView}
                    workspace={workspace}
                    workspaceActionsButton={workspaceActionsButton}
                    onArchiveAllWorkspaceTabs={handleArchiveAllWorkspaceTabs}
                    onArchiveOtherWorkspaceTabs={
                        handleArchiveOtherWorkspaceTabs
                    }
                    onArchiveWorkspaceTab={handleArchiveWorkspaceTab}
                    onCloseWorkspaceSplitView={closeWorkspaceSplitView}
                    onCreateWorkspaceFile={handleCreateWorkspaceFile}
                    onDeleteWorkspaceTab={handleDeleteWorkspaceTab}
                    onDuplicateWorkspaceTab={handleDuplicateWorkspaceTab}
                    onResizeSplitCancel={handleResizeSplitCancel}
                    onResizeSplitCommit={handleResizeSplitCommit}
                    onResizeSplitPreview={handleResizeSplitPreview}
                    onSelectWorkspaceTab={selectWorkspaceTab}
                    onSplitWorkspaceTab={splitWorkspaceTab}
                    onToggleWorkspaceTabPinned={handleToggleWorkspaceTabPinned}
                />
            </DragDropProvider>
            <WorkspaceActiveTabStatus
                activeTab={activeTab}
                activeTabIndex={activeTabIndex}
                tabCount={workspace.tabs.length}
            />
            <WorkspaceExecutionHistoryModal
                isOpen={executionHistoryModal.isOpen}
                entries={workspace.executionHistory}
                onClose={executionHistoryModal.onClose}
                onReRun={executeHistoryEntry}
            />
        </section>
    );
}

function WorkspaceReadyContent({
    activeTab,
    createFileAction,
    isSplitViewArchiveScopeEnabled,
    isTabDragActive,
    middleClickTabAction,
    renameState,
    resolvedSplitView,
    workspace,
    workspaceActionsButton,
    onArchiveAllWorkspaceTabs,
    onArchiveOtherWorkspaceTabs,
    onArchiveWorkspaceTab,
    onCloseWorkspaceSplitView,
    onCreateWorkspaceFile,
    onDeleteWorkspaceTab,
    onDuplicateWorkspaceTab,
    onResizeSplitCancel,
    onResizeSplitCommit,
    onResizeSplitPreview,
    onSelectWorkspaceTab,
    onSplitWorkspaceTab,
    onToggleWorkspaceTabPinned,
}: WorkspaceReadyContentProps): ReactElement {
    const editorRegionTabBar = useMemo(
        () => ({
            workspaceBase: {
                workspacePath: workspace.workspacePath,
                workspaceName: workspace.workspaceName,
                archivedTabs: workspace.archivedTabs,
                executionHistory: workspace.executionHistory,
                splitView: resolvedSplitView,
            },
            renameState,
            isTabDragActive,
            onCreateFile: onCreateWorkspaceFile,
            onSelectTab: onSelectWorkspaceTab,
            onDuplicateTab: onDuplicateWorkspaceTab,
            onArchiveTab: onArchiveWorkspaceTab,
            onArchiveAllTabs: onArchiveAllWorkspaceTabs,
            onArchiveOtherTabs: onArchiveOtherWorkspaceTabs,
            onToggleTabPinned: onToggleWorkspaceTabPinned,
            onDeleteTab: onDeleteWorkspaceTab,
            onSplitTab: onSplitWorkspaceTab,
            onCloseSplitView: onCloseWorkspaceSplitView,
            middleClickTabAction,
            isSplitViewArchiveScopeEnabled,
        }),
        [
            isSplitViewArchiveScopeEnabled,
            isTabDragActive,
            middleClickTabAction,
            onArchiveAllWorkspaceTabs,
            onArchiveOtherWorkspaceTabs,
            onArchiveWorkspaceTab,
            onCloseWorkspaceSplitView,
            onCreateWorkspaceFile,
            onDeleteWorkspaceTab,
            onDuplicateWorkspaceTab,
            onSelectWorkspaceTab,
            onSplitWorkspaceTab,
            onToggleWorkspaceTabPinned,
            renameState,
            resolvedSplitView,
            workspace.archivedTabs,
            workspace.executionHistory,
            workspace.workspaceName,
            workspace.workspacePath,
        ],
    );

    return (
        <>
            {workspace.tabs.length > 0 && !resolvedSplitView ? (
                <WorkspaceTabBar
                    workspace={workspace}
                    splitView={null}
                    tabListScopeId="workspace-root"
                    renameState={renameState}
                    previewTabs={workspace.tabs}
                    isTabDragActive={isTabDragActive}
                    splitDropTarget={null}
                    onCreateFile={onCreateWorkspaceFile}
                    onSelectTab={onSelectWorkspaceTab}
                    onDuplicateTab={onDuplicateWorkspaceTab}
                    onArchiveTab={onArchiveWorkspaceTab}
                    onArchiveAllTabs={onArchiveAllWorkspaceTabs}
                    onArchiveOtherTabs={onArchiveOtherWorkspaceTabs}
                    onToggleTabPinned={onToggleWorkspaceTabPinned}
                    onDeleteTab={onDeleteWorkspaceTab}
                    onSplitTab={onSplitWorkspaceTab}
                    onCloseSplitView={onCloseWorkspaceSplitView}
                    middleClickTabAction={middleClickTabAction}
                    isSplitViewArchiveScopeEnabled={
                        isSplitViewArchiveScopeEnabled
                    }
                />
            ) : null}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {workspace.tabs.length === 0 ? (
                    <WorkspaceMessageState
                        eyebrow={
                            workspace.archivedTabs.length > 0
                                ? "Archived tabs"
                                : "Empty workspace"
                        }
                        title={undefined}
                        description={
                            workspace.archivedTabs.length > 0
                                ? "Restore archived tabs from Settings, or create a new file to keep working."
                                : "Scripts are stored directly in this workspace directory. Create a file, then edit it in the editor."
                        }
                        illustrationUrl={emptyTabIcon}
                        action={createFileAction}
                    />
                ) : activeTab ? (
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
                            <WorkspaceEditorRegion
                                splitView={resolvedSplitView}
                                onResizeSplitPreview={onResizeSplitPreview}
                                onResizeSplitCommit={onResizeSplitCommit}
                                onResizeSplitCancel={onResizeSplitCancel}
                                workspaceActionsButton={workspaceActionsButton}
                                tabBar={editorRegionTabBar}
                            />
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
        </>
    );
}

function WorkspaceActiveTabStatus({
    activeTab,
    activeTabIndex,
    tabCount,
}: WorkspaceActiveTabStatusProps): ReactElement {
    return (
        <div className="sr-only" aria-live="polite">
            {tabCount === 0
                ? "No active tab"
                : activeTabIndex >= 0 && activeTab
                  ? `${activeTab.fileName} open`
                  : "No active tab"}
        </div>
    );
}
