import { type DragDropEventHandlers, DragDropProvider } from "@dnd-kit/react";
import { Add01Icon, Menu02Icon } from "@hugeicons/core-free-icons";
import {
    type ReactElement,
    type MouseEvent as ReactMouseEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { APP_HOTKEYS } from "../../constants/app/hotkeys";
import { useWorkspaceUiStore } from "../../hooks/workspace/useWorkspaceUiStore";
import {
    reorderTabPreview,
    TAB_BAR_MODIFIERS,
    TAB_BAR_SENSORS,
    TAB_BAR_SORTABLE_GROUP,
} from "../../lib/workspace/tabBar";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import { WorkspaceTabContextMenu } from "./tabBar/WorkspaceTabContextMenu";
import { WorkspaceTabItem } from "./tabBar/WorkspaceTabItem";
import { WorkspaceTabListDropdown } from "./tabBar/WorkspaceTabListDropdown";
import type { WorkspaceTabBarProps } from "./workspaceScreen.type";
import type { WorkspaceTabContextMenuState } from "./workspaceTabBar.type";

export function WorkspaceTabBar({
    workspace,
    renameState,
    onCreateFile,
    onSelectTab,
    onReorderTab,
    onDuplicateTab,
    onArchiveTab,
    onDeleteTab,
    middleClickTabAction,
}: WorkspaceTabBarProps): ReactElement {
    const tabBarRef = useRef<HTMLDivElement | null>(null);
    const tabListContainerRef = useRef<HTMLDivElement | null>(null);
    const tabListDropdownRef = useRef<HTMLDivElement | null>(null);
    const lastDropTargetTabIdRef = useRef<string | null>(null);
    const lastPreviewTargetTabIdRef = useRef<string | null>(null);
    const [isTabDragActive, setIsTabDragActive] = useState(false);
    const [previewTabs, setPreviewTabs] = useState(workspace.tabs);
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

    useEffect(() => {
        setPreviewTabs(workspace.tabs);
    }, [workspace.tabs]);

    const resetPreviewTabs = (): void => {
        setPreviewTabs(workspace.tabs);
    };

    const handleDragOver: DragDropEventHandlers["onDragOver"] = ({
        operation,
    }): void => {
        const draggedTabId = operation.source?.id;
        const targetTabId = operation.target?.id;

        if (
            typeof draggedTabId !== "string" ||
            typeof targetTabId !== "string"
        ) {
            return;
        }

        if (draggedTabId === targetTabId) {
            return;
        }

        if (lastPreviewTargetTabIdRef.current === targetTabId) {
            return;
        }

        lastDropTargetTabIdRef.current = targetTabId;
        lastPreviewTargetTabIdRef.current = targetTabId;
        setPreviewTabs(
            reorderTabPreview(workspace.tabs, draggedTabId, targetTabId),
        );
    };

    const handleDragStart: DragDropEventHandlers["onDragStart"] = (): void => {
        setIsTabDragActive(true);
        setContextMenuState(null);
        lastDropTargetTabIdRef.current = null;
        lastPreviewTargetTabIdRef.current = null;
        setPreviewTabs(workspace.tabs);
    };

    const handleDragEnd: DragDropEventHandlers["onDragEnd"] = ({
        canceled,
        operation,
    }): void => {
        setIsTabDragActive(false);
        lastPreviewTargetTabIdRef.current = null;

        if (canceled) {
            lastDropTargetTabIdRef.current = null;
            resetPreviewTabs();
            return;
        }

        const draggedTabId = operation.source?.id;
        const rawTargetTabId = operation.target?.id;
        const targetTabId =
            typeof rawTargetTabId === "string" &&
            rawTargetTabId !== draggedTabId
                ? rawTargetTabId
                : lastDropTargetTabIdRef.current;

        lastDropTargetTabIdRef.current = null;

        if (
            typeof draggedTabId !== "string" ||
            typeof targetTabId !== "string"
        ) {
            resetPreviewTabs();
            return;
        }

        onReorderTab(draggedTabId, targetTabId);
    };

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

    return (
        <div
            ref={tabBarRef}
            className="relative shrink-0 flex items-center gap-2 border-b border-fumi-200 bg-fumi-100 px-2 py-1.5"
        >
            <DragDropProvider
                modifiers={TAB_BAR_MODIFIERS}
                sensors={TAB_BAR_SENSORS}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div
                    ref={tabListContainerRef}
                    role="tablist"
                    aria-label="Workspace files"
                    className="min-w-0 flex flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {previewTabs.map((tab, index) => (
                        <WorkspaceTabItem
                            key={tab.id}
                            index={index}
                            sortableGroup={TAB_BAR_SORTABLE_GROUP}
                            tab={tab}
                            isActive={tab.id === workspace.activeTabId}
                            isTabDragActive={isTabDragActive}
                            middleClickTabAction={middleClickTabAction}
                            onOpenContextMenu={handleOpenContextMenu}
                            onArchiveTab={onArchiveTab}
                            onDeleteTab={onDeleteTab}
                            onSelectTab={onSelectTab}
                            handleRenameInputBlur={handleRenameInputBlur}
                            handleRenameInputChange={handleRenameInputChange}
                            handleRenameInputKeyDown={handleRenameInputKeyDown}
                            handleStartRename={handleStartRename}
                            hasRenameError={hasRenameError}
                            isRenameSubmitting={isRenameSubmitting}
                            renameInputRef={renameInputRef}
                            renameValue={renameValue}
                            renamingTabId={renamingTabId}
                        />
                    ))}
                </div>
            </DragDropProvider>
            <WorkspaceTabContextMenu
                isOpen={contextMenuState !== null}
                position={{
                    x: contextMenuState?.x ?? 0,
                    y: contextMenuState?.y ?? 0,
                }}
                onDuplicate={handleDuplicateFromContextMenu}
                onArchive={handleArchiveFromContextMenu}
                onClose={closeContextMenu}
                onDelete={handleDeleteFromContextMenu}
                onRename={handleRenameFromContextMenu}
            />
            <div
                ref={tabListDropdownRef}
                className="relative ml-auto flex shrink-0 items-center gap-1"
            >
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
                    shortcut={APP_HOTKEYS.CREATE_WORKSPACE_FILE.label}
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
