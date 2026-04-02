import type { UseWorkspaceTabRenameResult } from "../../../hooks/workspace/useWorkspaceTabRename";
import type {
    WorkspaceSession,
    WorkspaceTab,
} from "../../../lib/workspace/workspace.type";

export type WorkspaceTabItemProps = {
    index: number;
    sortableGroup: string;
    tab: WorkspaceTab;
    isActive: boolean;
    isTabDragActive: boolean;
    onArchiveTab: (tabId: string) => void;
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
    workspace: WorkspaceSession;
    onClose: () => void;
    onSelectTab: (tabId: string) => void;
};
