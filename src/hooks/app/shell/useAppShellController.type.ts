import type { ReactElement } from "react";
import type {
    AppCommandPaletteActionProps,
    AppCommandPaletteContextProps,
    AppCommandPaletteRequestProps,
} from "../../../components/app/commandPalette/appCommandPalette.type";
import type { AppTopbarExecutorControlsProps } from "../../../components/app/topbar/appTopbar.type";
import type {
    AppSidebarItem,
    AppSidebarPosition,
} from "../../../lib/app/sidebar.type";
import type { UseWorkspaceExecutorResult } from "../../../lib/workspace/executor/executor.type";

export type AppShellTopbarState = {
    workspaceName: string | null;
    workspacePath: string | null;
    onOpenWorkspace: (() => void) | undefined;
    executorControls: AppTopbarExecutorControlsProps | undefined;
};

export type AppShellSidebarState = {
    isOpen: boolean;
    position: AppSidebarPosition;
    activeItem: AppSidebarItem;
    showsSettingsUpdateIndicator: boolean;
    onSelectItem: (item: AppSidebarItem) => void;
    onToggle: () => void;
};

export type AppShellCommandPaletteState = {
    request: AppCommandPaletteRequestProps;
    context: AppCommandPaletteContextProps;
    actions: AppCommandPaletteActionProps;
};

export type UseAppShellControllerResult = {
    activeScreen: ReactElement;
    commandPalette: AppShellCommandPaletteState;
    isDragActive: boolean;
    sidebar: AppShellSidebarState;
    topbar: AppShellTopbarState;
    workspaceExecutor: UseWorkspaceExecutorResult;
};
