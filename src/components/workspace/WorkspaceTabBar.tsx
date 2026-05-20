import type { ReactElement } from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWorkspaceTabBarState } from "../../hooks/workspace/tabBar/useWorkspaceTabBarState";
import { useWorkspaceTabContextMenuActions } from "../../hooks/workspace/tabBar/useWorkspaceTabContextMenuActions";
import { getAppHotkeyShortcutLabel } from "../../lib/app/hotkeys/hotkeys";
import { joinClassNames } from "../../lib/shared/className";
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
    tabListScopeId,
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
        tabListScopeId,
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
    const controlsClearanceClass = isSplit ? "mr-32" : "mr-24";
    const singlePaneTabsClassName = joinClassNames(
        "min-w-0 flex items-center gap-2 px-2 py-1.5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
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
    const contextMenuActions = useWorkspaceTabContextMenuActions({
        contextMenuState,
        isSplitViewArchiveScopeEnabled,
        splitView,
        workspace,
        onArchiveAllTabs,
        onArchiveOtherTabs,
        onArchiveTab,
        onDeleteTab,
        onDuplicateTab,
        onSplitTab,
        onToggleTabPinned,
        onStartRename: handleStartRename,
    });

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
            className="relative z-20 w-full min-w-0 shrink-0 overflow-visible border-b border-fumi-200 bg-fumi-100"
        >
            <div className="relative flex items-stretch">
                <div
                    ref={tabListContainerRef}
                    role="tablist"
                    aria-label="Workspace files"
                    className={`min-w-0 flex-1 overflow-hidden ${controlsClearanceClass}`}
                >
                    <WorkspaceTabBarTabs layout={tabsLayout} items={tabItems} />
                </div>
            </div>

            <WorkspaceTabContextMenu
                isOpen={contextMenuState !== null}
                position={contextMenuPosition}
                splitView={splitView}
                canArchiveOtherTabs={contextMenuActions.canArchiveOtherTabs}
                isPinned={contextMenuTab?.isPinned === true}
                onDuplicate={contextMenuActions.onDuplicate}
                onArchive={contextMenuActions.onArchive}
                onArchiveAll={contextMenuActions.onArchiveAll}
                onArchiveOther={contextMenuActions.onArchiveOther}
                onTogglePinned={contextMenuActions.onTogglePinned}
                onClose={closeContextMenu}
                onDelete={contextMenuActions.onDelete}
                onRename={contextMenuActions.onRename}
                onSplitLeft={contextMenuActions.onSplitLeft}
                onSplitRight={contextMenuActions.onSplitRight}
                onSplitTop={contextMenuActions.onSplitTop}
                onSplitBottom={contextMenuActions.onSplitBottom}
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
