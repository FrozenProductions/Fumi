import type {
    WorkspaceExecutorActions,
    WorkspaceExecutorState,
} from "../../hooks/workspace/useWorkspaceExecutor.type";
import type {
    AppIconGlyph,
    AppSidebarItem,
    AppSidebarPosition,
} from "../../lib/app/app.type";
import type { AppCommandPaletteControllerOptions } from "../../lib/app/commandPalette.type";

export type AppCommandPaletteProps = AppCommandPaletteControllerOptions;

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
    onToggleSidebar: () => void;
    workspaceName?: string | null;
    workspacePath?: string | null;
    onOpenWorkspace?: () => void;
    executorControls?: AppTopbarExecutorControlsProps;
};
