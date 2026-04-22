import type {
    CSSProperties,
    MouseEvent as ReactMouseEvent,
    RefObject,
} from "react";
import type { UseWorkspaceTabRenameResult } from "../../../hooks/workspace/tabBar/useWorkspaceTabRename.type";
import type { AppMiddleClickTabAction } from "../../../lib/app/app.type";
import type {
    WorkspacePaneId,
    WorkspaceScreenSession,
    WorkspaceScreenTab,
    WorkspaceSplitView,
} from "../../../lib/workspace/workspace.type";

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
    onDuplicate: () => void;
    onArchive: () => void;
    onClose: () => void;
    onDelete: () => void;
    onRename: () => void;
    onOpenInLeftPane: () => void;
    onOpenInRightPane: () => void;
    onCloseSplitView: () => void;
};

export type WorkspaceTabBarTabsProps = {
    layout: {
        activeTabId: string | null;
        dividerStyle: CSSProperties;
        isSplit: boolean;
        primarySectionStyle: CSSProperties;
        primaryTabs: readonly WorkspaceScreenTab[];
        secondarySectionStyle: CSSProperties;
        secondaryTabId: string | null;
        secondaryTabs: readonly WorkspaceScreenTab[];
        secondaryTabsClassName: string;
        singlePaneTabsClassName: string;
        splitDividerClassName: string;
        splitDropTarget: WorkspacePaneId | null;
        splitView: WorkspaceSplitView | null;
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
        onOpenTabInPane: (tabId: string, pane: WorkspacePaneId) => void;
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
