import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type { AppCommandPaletteItem } from "../../lib/app/app.type";
import type { WorkspaceTab } from "../../lib/workspace/workspace.type";

export type GetCommandPaletteCommandItemsOptions = {
    workspaceSession: UseWorkspaceSessionResult;
    isSidebarOpen: boolean;
    onActivateGoToLineMode: () => void;
    onOpenSettings: () => void;
    onToggleSidebar: () => void;
};

export type GetGoToLineCommandPaletteItemsOptions = {
    activeTab: WorkspaceTab | null;
    goToLineNumber: number | null;
    onGoToLine: (lineNumber: number) => void;
};

export type WorkspaceCommandPaletteItem = AppCommandPaletteItem;
