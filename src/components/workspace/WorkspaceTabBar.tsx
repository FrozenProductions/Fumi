import type { CSSProperties, ReactElement } from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWorkspaceTabBarState } from "../../hooks/workspace/useWorkspaceTabBarState";
import { getAppHotkeyShortcutLabel } from "../../lib/app/hotkeys";
import { joinClassNames } from "../../lib/shared/className";
import { WorkspaceTabBarControls } from "./tabBar/WorkspaceTabBarControls";
import { WorkspaceTabBarTabs } from "./tabBar/WorkspaceTabBarTabs";
import { WorkspaceTabContextMenu } from "./tabBar/WorkspaceTabContextMenu";
import type { WorkspaceTabBarInternalProps } from "./workspaceTabBar.type";

/**
 * The tab bar for workspace files with drag-and-drop reordering.
 *
 * @param props - Component props
 * @param props.workspace - The workspace data
 * @param props.splitView - Current split view if any
 * @param props.renameState - Current rename state
 * @param props.onCreateFile - Create new file
 * @param props.onSelectTab - Select a tab
 * @param props.onArchiveTab - Archive a tab
 * @param props.onDeleteTab - Delete a tab
 * @returns A React component
 */
export function WorkspaceTabBar({
    workspace,
    splitView,
    renameState,
    previewTabs,
    isTabDragActive,
    splitDropTarget,
    onCreateFile,
    onSelectTab,
    onDuplicateTab,
    onArchiveTab,
    onDeleteTab,
    onOpenTabInPane,
    onCloseSplitView,
    middleClickTabAction,
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
    const secondaryTabId = splitView?.secondaryTabId ?? null;
    const secondaryTabIds = splitView?.secondaryTabIds ?? [];
    const splitRatio = splitView?.splitRatio ?? 0.5;
    const primarySectionStyle = {
        width: `${splitRatio * 100}%`,
    } satisfies CSSProperties;
    const secondarySectionStyle = {
        width: `${(1 - splitRatio) * 100}%`,
    } satisfies CSSProperties;
    const dividerStyle = {
        left: `${splitRatio * 100}%`,
    } satisfies CSSProperties;
    const controlsClearanceClass = isSplit ? "pr-32" : "pr-24";
    const splitDividerClassName = joinClassNames(
        "pointer-events-none absolute bottom-0 top-0 z-10 w-px -translate-x-1/2 transition-colors duration-150",
        splitDropTarget === "secondary" ? "bg-fumi-400/60" : "bg-fumi-200",
    );
    const secondaryTabsClassName = joinClassNames(
        "min-w-0 flex items-center gap-2 overflow-x-auto overflow-y-hidden px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        controlsClearanceClass,
        splitDropTarget === "secondary" && "bg-fumi-200/40",
    );
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
    const previewTabsById = new Map(
        previewTabs.map((tab) => [tab.id, tab] as const),
    );
    const secondaryTabIdSet = new Set(secondaryTabIds);
    const primaryTabs = isSplit
        ? previewTabs.filter((tab) => !secondaryTabIdSet.has(tab.id))
        : previewTabs;
    const secondaryTabs = isSplit
        ? secondaryTabIds
              .map((id) => previewTabsById.get(id))
              .filter(
                  (tab): tab is (typeof previewTabs)[number] =>
                      tab !== undefined,
              )
        : [];

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

    const handleDuplicateFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onDuplicateTab(contextMenuState.tabId);
    };

    const handleOpenInLeftPaneFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onOpenTabInPane(contextMenuState.tabId, "primary");
    };

    const handleOpenInRightPaneFromContextMenu = (): void => {
        if (!contextMenuState) {
            return;
        }

        onOpenTabInPane(contextMenuState.tabId, "secondary");
    };
    const closeSplitViewShortcutLabel = getAppHotkeyShortcutLabel(
        "TOGGLE_WORKSPACE_SPLIT_VIEW",
        hotkeyBindings,
    );
    const createFileShortcutLabel = getAppHotkeyShortcutLabel(
        "CREATE_WORKSPACE_FILE",
        hotkeyBindings,
    );

    return (
        <div
            ref={tabBarRef}
            className="relative shrink-0 border-b border-fumi-200 bg-fumi-100"
        >
            <div className="relative flex items-stretch">
                <div
                    ref={tabListContainerRef}
                    role="tablist"
                    aria-label="Workspace files"
                    className="min-w-0 flex-1 overflow-hidden"
                >
                    <WorkspaceTabBarTabs
                        layout={{
                            activeTabId,
                            dividerStyle,
                            isSplit,
                            primarySectionStyle,
                            primaryTabs,
                            secondarySectionStyle,
                            secondaryTabId,
                            secondaryTabs,
                            secondaryTabsClassName,
                            singlePaneTabsClassName,
                            splitDividerClassName,
                            splitDropTarget,
                            splitView,
                        }}
                        items={{
                            isTabDragActive,
                            middleClickTabAction,
                            onArchiveTab,
                            onDeleteTab,
                            onOpenContextMenu: openContextMenu,
                            onOpenTabInPane,
                            onSelectTab,
                            rename: {
                                handleRenameInputBlur,
                                handleRenameInputChange,
                                handleRenameInputKeyDown,
                                handleStartRename,
                                hasRenameError,
                                isRenameSubmitting,
                                renameInputRef,
                                renameValue,
                                renamingTabId,
                            },
                        }}
                    />
                </div>
            </div>

            <WorkspaceTabContextMenu
                isOpen={contextMenuState !== null}
                position={contextMenuPosition}
                splitView={splitView}
                onDuplicate={handleDuplicateFromContextMenu}
                onArchive={handleArchiveFromContextMenu}
                onClose={closeContextMenu}
                onDelete={handleDeleteFromContextMenu}
                onRename={handleRenameFromContextMenu}
                onOpenInLeftPane={handleOpenInLeftPaneFromContextMenu}
                onOpenInRightPane={handleOpenInRightPaneFromContextMenu}
                onCloseSplitView={onCloseSplitView}
            />

            <WorkspaceTabBarControls
                refs={{
                    tabListDropdownRef,
                }}
                state={{
                    closeSplitViewShortcutLabel,
                    createFileShortcutLabel,
                    isSplit,
                    isTabListOpen,
                    tabListButtonClassName,
                }}
                workspace={workspace}
                actions={{
                    closeContextMenu,
                    closeTabList,
                    onCloseSplitView,
                    onCreateFile,
                    onSelectTab,
                    toggleTabList,
                }}
            />
        </div>
    );
}
