import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/useWorkspaceExecutor.type";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type { UseWorkspaceTabRenameResult } from "../../hooks/workspace/useWorkspaceTabRename.type";
import type { AppMiddleClickTabAction } from "../../lib/app/app.type";
import type { WorkspaceSession } from "../../lib/workspace/workspace.type";

export type WorkspaceScreenProps = {
    session: UseWorkspaceSessionResult;
    executor: UseWorkspaceExecutorResult;
};

export type WorkspaceTabBarProps = {
    workspace: WorkspaceSession;
    renameState: UseWorkspaceTabRenameResult;
    onCreateFile: () => void;
    onSelectTab: (tabId: string) => void;
    onReorderTab: (draggedTabId: string, targetTabId: string) => void;
    onDuplicateTab: (tabId: string) => void;
    onArchiveTab: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    middleClickTabAction: AppMiddleClickTabAction;
};
