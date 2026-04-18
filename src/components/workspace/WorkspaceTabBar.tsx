import {
    Add01Icon,
    Cancel01Icon,
    Menu02Icon,
} from "@hugeicons/core-free-icons";
import {
    type CSSProperties,
    type ReactElement,
    type MouseEvent as ReactMouseEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWorkspaceUiStore } from "../../hooks/workspace/useWorkspaceUiStore";
import { getAppHotkeyShortcutLabel } from "../../lib/app/hotkeys";
import { TAB_BAR_SORTABLE_GROUP } from "../../lib/workspace/tabBar";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import { WorkspaceTabContextMenu } from "./tabBar/WorkspaceTabContextMenu";
import { WorkspaceTabItem } from "./tabBar/WorkspaceTabItem";
import { WorkspaceTabListDropdown } from "./tabBar/WorkspaceTabListDropdown";
import type { WorkspaceTabBarProps } from "./workspaceScreen.type";
import type { WorkspaceTabContextMenuState } from "./workspaceTabBar.type";

export type WorkspaceTabBarDragCallbacks = {
    onDragPreview: (draggedTabId: string, targetTabId: string) => void;
    onDragStart: () => void;
    onDragEnd: (
        canceled: boolean,
        draggedTabId: string | undefined,
        rawTargetTabId: string | undefined,
    ) => void;
};

type WorkspaceTabBarInternalProps = WorkspaceTabBarProps &
    WorkspaceTabBarDragCallbacks & {
        previewTabs: WorkspaceTabBarProps["workspace"]["tabs"];
        isTabDragActive: boolean;
    };

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
    const tabBarRef = useRef<HTMLDivElement | null>(null);
    const tabListContainerRef = useRef<HTMLDivElement | null>(null);
    const tabListDropdownRef = useRef<HTMLDivElement | null>(null);
    const [contextMenuState, setContextMenuState] =
        useState<WorkspaceTabContextMenuState | null>(null);
    const isTabListOpen = useWorkspaceUiStore((state) => state.isTabListOpen);
    const closeTabList = useWorkspaceUiStore((state) => state.closeTabList);
    const toggleTabList = useWorkspaceUiStore((state) => state.toggleTabList);
    const activeTabId = workspace.activeTabId;
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

    useEffect(() => {
        if (!isTabListOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent): void => {
            if (
                tabListDropdownRef.current?.contains(event.target as Node) ??
                false
            ) {
                return;
            }

            closeTabList();
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closeTabList, isTabListOpen]);

    useEffect(() => {
        if (!contextMenuState) {
            return;
        }

        const handleWindowBlur = (): void => {
            setContextMenuState(null);
        };

        window.addEventListener("blur", handleWindowBlur);

        return () => {
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [contextMenuState]);

    useEffect(() => {
        if (!activeTabId) {
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            const tabElement =
                tabListContainerRef.current?.querySelector<HTMLElement>(
                    `[data-tab-id="${activeTabId}"]`,
                );

            tabElement?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest",
            });
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [activeTabId]);

    const handleOpenContextMenu = (
        tabId: string,
        event: ReactMouseEvent<HTMLDivElement>,
    ): void => {
        event.preventDefault();
        const tabRect = event.currentTarget.getBoundingClientRect();
        const tabBarRect = tabBarRef.current?.getBoundingClientRect();
        const offsetLeft = tabBarRect?.left ?? 0;
        const offsetTop = tabBarRect?.top ?? 0;

        closeTabList();
        setContextMenuState({
            tabId,
            x: tabRect.left - offsetLeft - 2,
            y: tabRect.bottom - offsetTop + 2,
        });
    };

    const closeContextMenu = (): void => {
        setContextMenuState(null);
    };

    const contextMenuPosition = {
        x: contextMenuState?.x ?? 0,
        y: contextMenuState?.y ?? 0,
    };

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

    const sharedTabItemProps = {
        isTabDragActive,
        middleClickTabAction,
        onOpenContextMenu: handleOpenContextMenu,
        onArchiveTab,
        onDeleteTab,
        onSelectTab,
        handleRenameInputBlur,
        handleRenameInputChange,
        handleRenameInputKeyDown,
        handleStartRename,
        hasRenameError,
        isRenameSubmitting,
        renameInputRef,
        renameValue,
        renamingTabId,
    } as const;

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
                    {isSplit && secondaryTabs.length > 0 ? (
                        <div className="relative flex items-stretch">
                            <div
                                style={primarySectionStyle}
                                className="min-w-0 flex items-center gap-2 overflow-x-auto overflow-y-hidden px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {primaryTabs.map((tab, index) => {
                                    const isPrimary =
                                        splitView.primaryTabId === tab.id;
                                    const isVisibleInSplit = isPrimary;

                                    return (
                                        <WorkspaceTabItem
                                            key={tab.id}
                                            index={index}
                                            sortableGroup={
                                                TAB_BAR_SORTABLE_GROUP
                                            }
                                            tab={tab}
                                            isActive={tab.id === activeTabId}
                                            isVisibleInSplit={isVisibleInSplit}
                                            {...sharedTabItemProps}
                                            onSelectTab={(id) =>
                                                onOpenTabInPane(id, "primary")
                                            }
                                        />
                                    );
                                })}
                            </div>

                            <div
                                style={dividerStyle}
                                className={[
                                    "pointer-events-none absolute bottom-0 top-0 z-10 w-px -translate-x-1/2 transition-colors duration-150",
                                    splitDropTarget === "secondary"
                                        ? "bg-fumi-400/60"
                                        : "bg-fumi-200",
                                ].join(" ")}
                            />

                            <div
                                style={secondarySectionStyle}
                                className={[
                                    "min-w-0 flex items-center gap-2 overflow-x-auto overflow-y-hidden px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                                    controlsClearanceClass,
                                    splitDropTarget === "secondary"
                                        ? "bg-fumi-200/40"
                                        : "",
                                ].join(" ")}
                            >
                                {secondaryTabs.map((tab, secIndex) => (
                                    <WorkspaceTabItem
                                        key={tab.id}
                                        index={primaryTabs.length + secIndex}
                                        sortableGroup={TAB_BAR_SORTABLE_GROUP}
                                        tab={tab}
                                        isActive={tab.id === activeTabId}
                                        isVisibleInSplit={
                                            tab.id === secondaryTabId
                                        }
                                        {...sharedTabItemProps}
                                        onSelectTab={(id) =>
                                            onOpenTabInPane(id, "secondary")
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            className={[
                                "min-w-0 flex items-center gap-2 px-2 py-1.5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                                controlsClearanceClass,
                            ].join(" ")}
                        >
                            {primaryTabs.map((tab, index) => (
                                <WorkspaceTabItem
                                    key={tab.id}
                                    index={index}
                                    sortableGroup={TAB_BAR_SORTABLE_GROUP}
                                    tab={tab}
                                    isActive={tab.id === activeTabId}
                                    isVisibleInSplit={false}
                                    {...sharedTabItemProps}
                                    onSelectTab={onSelectTab}
                                />
                            ))}
                        </div>
                    )}
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

            <div
                ref={tabListDropdownRef}
                className="absolute inset-y-0 right-0 z-20 flex items-center gap-1 bg-fumi-100 px-2 py-1.5"
            >
                {isSplit ? (
                    <AppTooltip
                        content="Close split view"
                        side="bottom"
                        shortcut={getAppHotkeyShortcutLabel(
                            "TOGGLE_WORKSPACE_SPLIT_VIEW",
                            hotkeyBindings,
                        )}
                    >
                        <button
                            type="button"
                            aria-label="Close split view"
                            onClick={onCloseSplitView}
                            className="app-select-none inline-flex size-7 items-center justify-center rounded-md border border-fumi-200 bg-fumi-50 text-fumi-500 transition-colors hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-100"
                        >
                            <AppIcon
                                icon={Cancel01Icon}
                                size={14}
                                strokeWidth={2.5}
                            />
                        </button>
                    </AppTooltip>
                ) : null}

                <AppTooltip content="Tab list" side="bottom">
                    <button
                        type="button"
                        onClick={() => {
                            closeContextMenu();
                            toggleTabList();
                        }}
                        aria-expanded={isTabListOpen}
                        aria-haspopup="menu"
                        className={[
                            "app-select-none inline-flex size-7 items-center justify-center rounded-md border text-fumi-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-100",
                            isTabListOpen
                                ? "border-fumi-300 bg-fumi-50 text-fumi-600"
                                : "border-fumi-200 bg-fumi-50 hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-600",
                        ].join(" ")}
                    >
                        <AppIcon
                            icon={Menu02Icon}
                            size={14}
                            strokeWidth={2.5}
                        />
                    </button>
                </AppTooltip>

                {isTabListOpen ? (
                    <WorkspaceTabListDropdown
                        workspace={workspace}
                        onClose={closeTabList}
                        onSelectTab={onSelectTab}
                    />
                ) : null}

                <div className="mx-0.5 h-4 w-[1px] bg-fumi-200" />

                <AppTooltip
                    content="New file"
                    side="bottom"
                    shortcut={getAppHotkeyShortcutLabel(
                        "CREATE_WORKSPACE_FILE",
                        hotkeyBindings,
                    )}
                >
                    <button
                        type="button"
                        onClick={onCreateFile}
                        className="app-select-none inline-flex size-7 items-center justify-center rounded-md border border-fumi-200 bg-fumi-50 text-fumi-500 transition-colors hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-100"
                    >
                        <AppIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
                    </button>
                </AppTooltip>
            </div>
        </div>
    );
}
