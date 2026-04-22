import type { MouseEvent as ReactMouseEvent } from "react";
import type { UseWorkspaceTabRenameResult } from "../../../hooks/workspace/useWorkspaceTabRename.type";
import type { AppMiddleClickTabAction } from "../../../lib/app/app.type";
import type {
    WorkspaceScreenSession,
    WorkspaceScreenTab,
    WorkspaceSplitView,
} from "../../../lib/workspace/workspace.type";

export type WorkspaceTabItemProps = {
    index: number;
    sortableGroup: string;
    tab: WorkspaceScreenTab;
    isActive: boolean;
    isVisibleInSplit: boolean;
    isTabDragActive: boolean;
    middleClickTabAction: AppMiddleClickTabAction;
    onOpenContextMenu: (
        tabId: string,
        event: ReactMouseEvent<HTMLDivElement>,
    ) => void;
    onArchiveTab: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    onSelectTab: (tabId: string) => void;
} & Pick<
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
