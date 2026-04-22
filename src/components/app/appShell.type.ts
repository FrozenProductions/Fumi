import type {
    UseWorkspaceExecutorResult,
    WorkspaceExecutorActions,
    WorkspaceExecutorState,
} from "../../hooks/workspace/useWorkspaceExecutor.type";
import type {
    AppCommandPaletteMode,
    AppCommandPaletteScope,
    AppIconGlyph,
    AppSidebarItem,
    AppSidebarPosition,
    AppTheme,
} from "../../lib/app/app.type";

export type AppCommandPaletteRequestProps = {
    isOpen: boolean;
    requestedScope: AppCommandPaletteScope | null;
    requestedMode: AppCommandPaletteMode | null;
};

export type AppCommandPaletteContextProps = {
    workspaceExecutor: UseWorkspaceExecutorResult;
    isSidebarOpen: boolean;
    activeSidebarItem: AppSidebarItem;
    theme: AppTheme;
    sidebarPosition: AppSidebarPosition;
    isOutlinePanelVisible: boolean;
};

export type AppCommandPaletteActionProps = {
    onClose: () => void;
    onGoToLine: (lineNumber: number) => void;
    onOpenWorkspaceScreen: () => void;
    onOpenAutomaticExecution: () => void;
    onOpenScriptLibrary: () => void;
    onOpenAccounts: () => void;
    onOpenExecutionHistory: () => void;
    onToggleSidebar: () => void;
    onToggleOutlinePanel: () => void;
    onOpenSettings: () => void;
    onSetTheme: (theme: AppTheme) => void;
    onSetSidebarPosition: (position: AppSidebarPosition) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onRequestRenameCurrentTab: () => void;
};

export type AppCommandPaletteProps = {
    request: AppCommandPaletteRequestProps;
    context: AppCommandPaletteContextProps;
    actions: AppCommandPaletteActionProps;
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
    position: AppSidebarPosition;
    activeItem: AppSidebarItem;
    showsSettingsUpdateIndicator: boolean;
    onSelectItem: (item: AppSidebarItem) => void;
};

export type AppTopbarExecutorControlsProps = {
    state: Pick<
        WorkspaceExecutorState,
        | "availablePorts"
        | "availablePortSummaries"
        | "didRecentAttachFail"
        | "hasSupportedExecutor"
        | "isAttached"
        | "isBusy"
        | "port"
    >;
    actions: Pick<WorkspaceExecutorActions, "toggleConnection" | "updatePort">;
};

export type AppTopbarProps = {
    title: string;
    isSidebarOpen: boolean;
    sidebarPosition: AppSidebarPosition;
    onToggleSidebar: () => void;
    workspaceName?: string | null;
    workspacePath?: string | null;
    onOpenWorkspace?: () => void;
    executorControls?: AppTopbarExecutorControlsProps;
};
