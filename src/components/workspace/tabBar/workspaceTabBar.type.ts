import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import type { UseWorkspaceTabRenameResult } from "../../../hooks/workspace/tabBar/useWorkspaceTabRename.type";
import type { AppMiddleClickTabAction } from "../../../lib/app/app.type";
import type { WorkspaceScreenSession } from "../../../lib/workspace/session/session.type";
import type {
    WorkspaceSplitPlacement,
    WorkspaceSplitView,
} from "../../../lib/workspace/session/sessionSplitView.type";
import type { WorkspaceScreenTab } from "../../../lib/workspace/session/tabs/sessionTabs.type";

export type WorkspaceTabBarProps = {
    workspace: WorkspaceScreenSession;
    splitView: WorkspaceSplitView | null;
    tabListScopeId: string;
    renameState: UseWorkspaceTabRenameResult;
    onCreateFile: () => void;
    onSelectTab: (tabId: string) => void;
    onDuplicateTab: (tabId: string) => void;
    onArchiveTab: (tabId: string) => void;
    onArchiveAllTabs: (scopeTabIds?: readonly string[]) => void;
    onArchiveOtherTabs: (
        tabId: string,
        scopeTabIds?: readonly string[],
    ) => void;
    onToggleTabPinned: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    onSplitTab: (
        tabId: string,
        targetPaneId: string | null,
        placement: WorkspaceSplitPlacement,
    ) => void;
    onCloseSplitView: () => void;
    splitDropTarget: null;
    middleClickTabAction: AppMiddleClickTabAction;
    isSplitViewArchiveScopeEnabled: boolean;
};

export type WorkspaceTabContextMenuState = {
    tabId: string;
    x: number;
    y: number;
};

export type WorkspaceTabBarInternalProps = WorkspaceTabBarProps & {
    previewTabs: WorkspaceTabBarProps["workspace"]["tabs"];
    isTabDragActive: boolean;
};

export type WorkspaceTabItemIdentityProps = {
    index: number;
    sortableGroup: string;
    tab: WorkspaceScreenTab;
};

export type WorkspaceTabItemStateProps = {
    isActive: boolean;
    isVisibleInSplit: boolean;
    isTabDragActive: boolean;
};

export type WorkspaceTabItemActionProps = {
    middleClickTabAction: AppMiddleClickTabAction;
    onOpenContextMenu: (
        tabId: string,
        event: ReactMouseEvent<HTMLDivElement>,
    ) => void;
    onArchiveTab: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    onSelectTab: (tabId: string) => void;
};

export type WorkspaceTabItemRenameProps = Pick<
    UseWorkspaceTabRenameResult,
    | "handleRenameInputBlur"
    | "handleRenameInputChange"
    | "handleRenameInputKeyDown"
    | "handleStartRename"
    | "hasRenameError"
    | "isRenameSubmitting"
    | "renameInputRef"
    | "renameValue"
    | "renamingTabId"
>;

export type WorkspaceTabItemProps = {
    item: WorkspaceTabItemIdentityProps;
    state: WorkspaceTabItemStateProps;
    actions: WorkspaceTabItemActionProps;
    rename: WorkspaceTabItemRenameProps;
};

export type WorkspaceTabListDropdownProps = {
    workspace: WorkspaceScreenSession;
    onClose: () => void;
    onSelectTab: (tabId: string) => void;
};

export type WorkspaceTabContextMenuProps = {
    isOpen: boolean;
    position: {
        x: number;
        y: number;
    };
    splitView: WorkspaceSplitView | null;
    canArchiveOtherTabs: boolean;
    isPinned: boolean;
    onDuplicate: () => void;
    onArchive: () => void;
    onArchiveAll: () => void;
    onArchiveOther: () => void;
    onTogglePinned: () => void;
    onClose: () => void;
    onDelete: () => void;
    onRename: () => void;
    onSplitLeft: () => void;
    onSplitRight: () => void;
    onSplitTop: () => void;
    onSplitBottom: () => void;
    onCloseSplitView: () => void;
};

export type WorkspaceTabBarTabsProps = {
    layout: {
        activeTabId: string | null;
        primaryTabs: readonly WorkspaceScreenTab[];
        singlePaneTabsClassName: string;
    };
    items: {
        isTabDragActive: boolean;
        middleClickTabAction: AppMiddleClickTabAction;
        onArchiveTab: (tabId: string) => void;
        onDeleteTab: (tabId: string) => void;
        onOpenContextMenu: (
            tabId: string,
            event: ReactMouseEvent<HTMLDivElement>,
        ) => void;
        onSelectTab: (tabId: string) => void;
        rename: WorkspaceTabItemRenameProps;
    };
};

export type WorkspaceTabBarControlsProps = {
    refs: {
        tabListDropdownRef: RefObject<HTMLDivElement | null>;
    };
    state: {
        closeSplitViewShortcutLabel: string | null;
        createFileShortcutLabel: string | null;
        isSplit: boolean;
        isTabListOpen: boolean;
        tabListButtonClassName: string;
    };
    workspace: WorkspaceScreenSession;
    actions: {
        closeContextMenu: () => void;
        closeTabList: () => void;
        onCloseSplitView: () => void;
        onCreateFile: () => void;
        onSelectTab: (tabId: string) => void;
        toggleTabList: () => void;
    };
};
