import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/useWorkspaceExecutor.type";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type {
    AppCommandPaletteMode,
    AppCommandPaletteScope,
    AppIconGlyph,
    AppSidebarItem,
    AppTheme,
} from "../../lib/app/app.type";

export type AppCommandPaletteProps = {
    isOpen: boolean;
    requestedScope: AppCommandPaletteScope | null;
    requestedMode: AppCommandPaletteMode | null;
    workspaceSession: UseWorkspaceSessionResult;
    workspaceExecutor: UseWorkspaceExecutorResult;
    isSidebarOpen: boolean;
    activeSidebarItem: AppSidebarItem;
    theme: AppTheme;
    onClose: () => void;
    onGoToLine: (lineNumber: number) => void;
    onOpenWorkspaceScreen: () => void;
    onOpenScriptLibrary: () => void;
    onOpenAccounts: () => void;
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
    onSetTheme: (theme: AppTheme) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onRequestRenameCurrentTab: () => void;
};

export type AppCommandPaletteScopeButtonProps = {
    ariaLabel: string;
    content: string;
    shortcut: string;
    icon: AppIconGlyph;
    isPressed: boolean;
    onClick: () => void;
};

export type AppSidebarProps = {
    isOpen: boolean;
    activeItem: AppSidebarItem;
    showsSettingsUpdateIndicator: boolean;
    onSelectItem: (item: AppSidebarItem) => void;
};

export type AppTopbarExecutorControlsProps = Pick<
    UseWorkspaceExecutorResult,
    | "availablePorts"
    | "port"
    | "isAttached"
    | "didRecentAttachFail"
    | "isBusy"
    | "updatePort"
    | "toggleConnection"
>;

export type AppTopbarProps = {
    title: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    workspaceName?: string | null;
    workspacePath?: string | null;
    onOpenWorkspace?: () => void;
    executorControls?: AppTopbarExecutorControlsProps;
};
