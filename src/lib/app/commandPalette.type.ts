import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/useWorkspaceExecutor.type";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type {
    AppCommandPaletteItem,
    AppSidebarItem,
    AppTheme,
} from "../../lib/app/app.type";
import type { WorkspaceTab } from "../../lib/workspace/workspace.type";

export type GetCommandPaletteCommandItemsOptions = {
    workspaceSession: UseWorkspaceSessionResult;
    workspaceExecutor: UseWorkspaceExecutorResult;
    isSidebarOpen: boolean;
    activeSidebarItem: AppSidebarItem;
    theme: AppTheme;
    onActivateGoToLineMode: () => void;
    onOpenWorkspaceScreen: () => void;
    onOpenScriptLibrary: () => void;
    onOpenAccounts: () => void;
    onOpenSettings: () => void;
    onToggleSidebar: () => void;
    onSetTheme: (theme: AppTheme) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onRequestRenameCurrentTab: () => void;
};

export type GetGoToLineCommandPaletteItemsOptions = {
    activeTab: WorkspaceTab | null;
    goToLineNumber: number | null;
    onGoToLine: (lineNumber: number) => void;
};

export type WorkspaceCommandPaletteItem = AppCommandPaletteItem;
