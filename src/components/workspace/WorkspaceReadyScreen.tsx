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
import { useWorkspaceRobloxControls } from "../../hooks/workspace/useWorkspaceRobloxControls";
import { useWorkspaceScreenHotkeys } from "../../hooks/workspace/useWorkspaceScreenHotkeys";
import { useWorkspaceStore } from "../../hooks/workspace/useWorkspaceStore";
import { useWorkspaceTabDragDrop } from "../../hooks/workspace/useWorkspaceTabDragDrop";
import { useWorkspaceTabRename } from "../../hooks/workspace/useWorkspaceTabRename";
import { getAppHotkeyShortcutLabel } from "../../lib/app/hotkeys";
import { WorkspaceEditorRegion } from "./WorkspaceEditorRegion";
import { WorkspaceExecutionHistoryModal } from "./WorkspaceExecutionHistoryModal";
import { WorkspaceMessageState } from "./WorkspaceMessageState";
import { WorkspaceTabBar } from "./WorkspaceTabBar";
import type {
    WorkspaceActionsButtonProps,
    WorkspaceScreenProps,
} from "./workspaceScreen.type";

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
    const renameCurrentTabRequest = useAppStore(
        (state) => state.renameCurrentTabRequest,
    );
    const clearRenameCurrentTabRequest = useAppStore(
        (state) => state.clearRenameCurrentTabRequest,
    );
    const editorSettings = useAppStore((state) => state.editorSettings);
    const toggleOutlinePanel = useAppStore((state) => state.toggleOutlinePanel);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const persistWorkspaceState = useWorkspaceStore(
        (state) => state.persistWorkspaceState,
    );
    const createWorkspaceFile = useWorkspaceStore(
        (state) => state.createWorkspaceFile,
    );
    const archiveWorkspaceTab = useWorkspaceStore(
        (state) => state.archiveWorkspaceTab,
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
    const openWorkspaceTabInPane = useWorkspaceStore(
        (state) => state.openWorkspaceTabInPane,
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
        splitDropTarget,
        resolvedSplitView,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleResizeSplitPreview,
        handleResizeSplitCancel,
        handleResizeSplitCommit,
    } = useWorkspaceTabDragDrop({
        splitView,
        openWorkspaceTabInPane,
        reorderWorkspaceTab,
        closeWorkspaceSplitView,
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
        <section className="flex h-full min-h-0 flex-col bg-fumi-50">
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
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="relative flex min-h-0 flex-1">
                                <WorkspaceEditorRegion
                                    splitView={resolvedSplitView}
                                    onResizeSplitPreview={
                                        handleResizeSplitPreview
                                    }
                                    onResizeSplitCommit={
                                        handleResizeSplitCommit
                                    }
                                    onResizeSplitCancel={
                                        handleResizeSplitCancel
                                    }
                                    workspaceActionsButton={
                                        workspaceActionsButton
                                    }
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
                entries={workspace.executionHistory}
                onClose={executionHistoryModal.onClose}
                onReRun={executeHistoryEntry}
            />
        </section>
    );
}
