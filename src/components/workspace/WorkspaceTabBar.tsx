import type { ReactElement } from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWorkspaceTabBarState } from "../../hooks/workspace/tabBar/useWorkspaceTabBarState";
import { getAppHotkeyShortcutLabel } from "../../lib/app/hotkeys/hotkeys";
import { joinClassNames } from "../../lib/shared/className";
import { getWorkspaceSplitScopeTabIds } from "../../lib/workspace/session/sessionSplitView";
import { WorkspaceTabBarControls } from "./tabBar/WorkspaceTabBarControls";
import { WorkspaceTabBarTabs } from "./tabBar/WorkspaceTabBarTabs";
import { WorkspaceTabContextMenu } from "./tabBar/WorkspaceTabContextMenu";
import type { WorkspaceTabBarInternalProps } from "./tabBar/workspaceTabBar.type";

/**
 * The tab bar for workspace files with drag-and-drop reordering.
 */
export function WorkspaceTabBar({
    workspace,
    splitView,
    renameState,
    previewTabs,
    isTabDragActive,
    onCreateFile,
    onSelectTab,
    onDuplicateTab,
    onArchiveTab,
    onArchiveAllTabs,
    onArchiveOtherTabs,
    onToggleTabPinned,
    onDeleteTab,
    onSplitTab,
    onCloseSplitView,
    middleClickTabAction,
    isSplitViewArchiveScopeEnabled,
}: WorkspaceTabBarInternalProps): ReactElement {
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const activeTabId = workspace.activeTabId;
    const workspaceTabBarState = useWorkspaceTabBarState({
        activeTabId,
    });
    const { tabBarRef, tabListContainerRef, tabListDropdownRef } =
        workspaceTabBarState.refs;
    const { contextMenuState, contextMenuPosition, isTabListOpen } =
        workspaceTabBarState.state;
    const { closeContextMenu, closeTabList, openContextMenu, toggleTabList } =
        workspaceTabBarState.actions;
    const {
        hasRenameError,
        isRenameSubmitting,
        renameInputRef,
        renameValue,
        renamingTabId,
        handleRenameInputBlur,
        handleRenameInputChange,
        handleRenameInputKeyDown,
        handleStartRename,
    } = renameState;

    const isSplit = splitView !== null;
    const controlsClearanceClass = isSplit ? "pr-32" : "pr-24";
    const singlePaneTabsClassName = joinClassNames(
        "min-w-0 flex items-center gap-2 px-2 py-1.5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        controlsClearanceClass,
    );
    const tabListButtonClassName = joinClassNames(
        "app-select-none inline-flex size-7 items-center justify-center rounded-md border text-fumi-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-100",
        isTabListOpen
            ? "border-fumi-300 bg-fumi-50 text-fumi-600"
            : "border-fumi-200 bg-fumi-50 hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-600",
    );
    const contextMenuTab = contextMenuState
        ? (workspace.tabs.find((tab) => tab.id === contextMenuState.tabId) ??
          null)
        : null;

    const handleRenameFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        const targetTab = workspace.tabs.find(
            (tab) => tab.id === contextMenuState.tabId,
        );

        if (!targetTab) {
            return;
        }

        handleStartRename(targetTab.id, targetTab.fileName);
    };

    const handleDeleteFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onDeleteTab(contextMenuState.tabId);
    };

    const handleArchiveFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onArchiveTab(contextMenuState.tabId);
    };

    const handleTogglePinnedFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onToggleTabPinned(contextMenuState.tabId);
    };

    const getContextMenuArchiveScopeTabIds = (): string[] | undefined => {
        if (
            !isSplitViewArchiveScopeEnabled ||
            !contextMenuState ||
            !splitView
        ) {
            return undefined;
        }

        return getWorkspaceSplitScopeTabIds(
            splitView,
            workspace.tabs,
            contextMenuState.tabId,
        );
    };

    const handleArchiveAllFromContextMenu = (): void => {
        onArchiveAllTabs(getContextMenuArchiveScopeTabIds());
    };

    const handleArchiveOtherFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onArchiveOtherTabs(
            contextMenuState.tabId,
            getContextMenuArchiveScopeTabIds(),
        );
    };

    const handleDuplicateFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onDuplicateTab(contextMenuState.tabId);
    };

    const handleSplitLeftFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onSplitTab(contextMenuState.tabId, null, "left");
    };

    const handleSplitRightFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onSplitTab(contextMenuState.tabId, null, "right");
    };

    const handleSplitTopFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onSplitTab(contextMenuState.tabId, null, "top");
    };

    const handleSplitBottomFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onSplitTab(contextMenuState.tabId, null, "bottom");
    };

    const closeSplitViewShortcutLabel = getAppHotkeyShortcutLabel(
        "TOGGLE_WORKSPACE_SPLIT_VIEW",
        hotkeyBindings,
    );
    const createFileShortcutLabel = getAppHotkeyShortcutLabel(
        "CREATE_WORKSPACE_FILE",
        hotkeyBindings,
    );
    const tabsLayout = {
        activeTabId,
        primaryTabs: previewTabs,
        singlePaneTabsClassName,
    };
    const tabItemRename = {
        handleRenameInputBlur,
        handleRenameInputChange,
        handleRenameInputKeyDown,
        handleStartRename,
        hasRenameError,
        isRenameSubmitting,
        renameInputRef,
        renameValue,
        renamingTabId,
    };
    const tabItems = {
        isTabDragActive,
        middleClickTabAction,
        onArchiveTab,
        onDeleteTab,
        onOpenContextMenu: openContextMenu,
        onSelectTab,
        rename: tabItemRename,
    };
    const controlsRefs = {
        tabListDropdownRef,
    };
    const controlsState = {
        closeSplitViewShortcutLabel,
        createFileShortcutLabel,
        isSplit,
        isTabListOpen,
        tabListButtonClassName,
    };
    const controlsActions = {
        closeContextMenu,
        closeTabList,
        onCloseSplitView,
        onCreateFile,
        onSelectTab,
        toggleTabList,
    };

    return (
        <div
            ref={tabBarRef}
            className="relative w-full min-w-0 shrink-0 overflow-hidden border-b border-fumi-200 bg-fumi-100"
        >
            <div className="relative flex items-stretch">
                <div
                    ref={tabListContainerRef}
                    role="tablist"
                    aria-label="Workspace files"
                    className="min-w-0 flex-1 overflow-hidden"
                >
                    <WorkspaceTabBarTabs layout={tabsLayout} items={tabItems} />
                </div>
            </div>

            <WorkspaceTabContextMenu
                isOpen={contextMenuState !== null}
                position={contextMenuPosition}
                splitView={splitView}
                canArchiveOtherTabs={
                    (
                        getContextMenuArchiveScopeTabIds()
                            ?.map((tabId) =>
                                workspace.tabs.find((tab) => tab.id === tabId),
                            )
                            .filter((tab) => tab && !tab.isPinned) ??
                        workspace.tabs.filter((tab) => !tab.isPinned)
                    ).length > 1
                }
                isPinned={contextMenuTab?.isPinned === true}
                onDuplicate={handleDuplicateFromContextMenu}
                onArchive={handleArchiveFromContextMenu}
                onArchiveAll={handleArchiveAllFromContextMenu}
                onArchiveOther={handleArchiveOtherFromContextMenu}
                onTogglePinned={handleTogglePinnedFromContextMenu}
                onClose={closeContextMenu}
                onDelete={handleDeleteFromContextMenu}
                onRename={handleRenameFromContextMenu}
                onSplitLeft={handleSplitLeftFromContextMenu}
                onSplitRight={handleSplitRightFromContextMenu}
                onSplitTop={handleSplitTopFromContextMenu}
                onSplitBottom={handleSplitBottomFromContextMenu}
                onCloseSplitView={onCloseSplitView}
            />

            <WorkspaceTabBarControls
                refs={controlsRefs}
                state={controlsState}
                workspace={workspace}
                actions={controlsActions}
            />
        </div>
    );
}
