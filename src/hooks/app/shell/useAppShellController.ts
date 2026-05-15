import { useEffect, useState } from "react";
import {
    APP_ZOOM_DEFAULT,
    APP_ZOOM_STEP,
} from "../../../constants/app/settings";
import {
    selectAutomaticExecutionHasUnsavedChanges,
    useAutomaticExecutionStore,
} from "../../../hooks/automaticExecution/useAutomaticExecutionStore";
import { useWorkspaceDroppedFiles } from "../../../hooks/workspace/useWorkspaceDroppedFiles";
import { useWorkspaceExecutor } from "../../../hooks/workspace/useWorkspaceExecutor";
import { useWorkspaceStore } from "../../../hooks/workspace/useWorkspaceStore";
import { useWorkspaceStoreLifecycle } from "../../../hooks/workspace/useWorkspaceStoreLifecycle";
import { showsWorkspaceContext } from "../../../lib/app/sidebar";
import { selectWorkspaceHasUnsavedChanges } from "../../../lib/workspace/store/selectors";
import { getAppScreen } from "../../../view/getAppScreen";
import { useAppDragDrop } from "../useAppDragDrop";
import { useAppStore } from "../useAppStore";
import { useAppThemeSync } from "../useAppThemeSync";
import { useAppUpdater } from "../useAppUpdater";
import { useAppZoomSync } from "../useAppZoomSync";
import { useAppExitGuard } from "./useAppExitGuard";
import type { UseAppShellControllerResult } from "./useAppShellController.type";
import { useAppShellLifecycle } from "./useAppShellLifecycle";

/**
 * Top-level composition hook that wires together all shell subsystems and returns the full shell state.
 *
 * Initializes workspace lifecycle, drag-and-drop, theme/zoom sync, updater, and exit guard.
 * Derives sidebar, topbar, command palette, and executor control props for the App shell.
 *
 * @returns The complete shell controller result used by the App component
 */
export function useAppShellController(): UseAppShellControllerResult {
    useWorkspaceStoreLifecycle();
    useWorkspaceDroppedFiles();
    useAppThemeSync();
    useAppZoomSync();

    const { isDragActive } = useAppDragDrop();
    const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
    const isCommandPaletteOpen = useAppStore(
        (state) => state.isCommandPaletteOpen,
    );
    const commandPaletteScope = useAppStore(
        (state) => state.commandPaletteScope,
    );
    const commandPaletteMode = useAppStore((state) => state.commandPaletteMode);
    const activeSidebarItem = useAppStore((state) => state.activeSidebarItem);
    const theme = useAppStore((state) => state.theme);
    const closeCommandPalette = useAppStore(
        (state) => state.closeCommandPalette,
    );
    const requestGoToLine = useAppStore((state) => state.requestGoToLine);
    const requestRenameCurrentTab = useAppStore(
        (state) => state.requestRenameCurrentTab,
    );
    const isOutlinePanelVisible = useAppStore(
        (state) => state.editorSettings.isOutlinePanelVisible,
    );
    const sidebarPosition = useAppStore((state) => state.sidebarPosition);
    const setSidebarPosition = useAppStore((state) => state.setSidebarPosition);
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);
    const toggleOutlinePanel = useAppStore((state) => state.toggleOutlinePanel);
    const selectSidebarItem = useAppStore((state) => state.selectSidebarItem);
    const setTheme = useAppStore((state) => state.setTheme);
    const updater = useAppUpdater();
    const showsSettingsUpdateIndicator =
        import.meta.env.DEV || updater.availableUpdate !== null;
    const replaceWorkspaceExecutionHistory = useWorkspaceStore(
        (state) => state.replaceWorkspaceExecutionHistory,
    );
    const workspacePath = useWorkspaceStore(
        (state) => state.workspace?.workspacePath ?? null,
    );
    const workspaceName = useWorkspaceStore(
        (state) => state.workspace?.workspaceName ?? null,
    );
    const hasWorkspace = useWorkspaceStore((state) => state.workspace !== null);
    const openWorkspaceDirectory = useWorkspaceStore(
        (state) => state.openWorkspaceDirectory,
    );
    const [isExecutionHistoryModalOpen, setIsExecutionHistoryModalOpen] =
        useState(false);
    const workspaceExecutor = useWorkspaceExecutor({
        workspacePath,
        onExecutionHistoryUpdated: replaceWorkspaceExecutionHistory,
    });
    const automaticExecutionHasUnsavedChanges = useAutomaticExecutionStore(
        selectAutomaticExecutionHasUnsavedChanges,
    );
    const workspaceHasUnsavedChanges = useWorkspaceStore(
        selectWorkspaceHasUnsavedChanges,
    );
    const hasUnsavedChanges =
        workspaceHasUnsavedChanges || automaticExecutionHasUnsavedChanges;
    const shouldShowWorkspaceContext = showsWorkspaceContext(activeSidebarItem);

    const handleOpenSettings = (): void => {
        selectSidebarItem("settings");
    };
    const handleOpenWorkspaceScreen = (): void => {
        selectSidebarItem("workspace");
    };
    const handleOpenExecutionHistory = (): void => {
        selectSidebarItem("workspace");
        setIsExecutionHistoryModalOpen(true);
    };
    const handleCloseExecutionHistory = (): void => {
        setIsExecutionHistoryModalOpen(false);
    };
    const handleOpenAutomaticExecution = (): void => {
        selectSidebarItem("automatic-execution");
    };
    const handleOpenScriptLibrary = (): void => {
        selectSidebarItem("script-library");
    };
    const handleOpenAccounts = (): void => {
        selectSidebarItem("accounts");
    };
    const handleOpenWorkspaceDirectory = (): void => {
        void openWorkspaceDirectory();
    };
    const handleZoomIn = (): void => {
        const { zoomPercent, setZoomPercent } = useAppStore.getState();
        const nextZoomPercent = zoomPercent + APP_ZOOM_STEP;
        setZoomPercent(nextZoomPercent);
    };
    const handleZoomOut = (): void => {
        const { zoomPercent, setZoomPercent } = useAppStore.getState();
        const nextZoomPercent = zoomPercent - APP_ZOOM_STEP;
        setZoomPercent(nextZoomPercent);
    };
    const handleZoomReset = (): void => {
        useAppStore.getState().setZoomPercent(APP_ZOOM_DEFAULT);
    };

    const activeScreen = getAppScreen(
        activeSidebarItem,
        workspaceExecutor,
        updater,
        {
            executionHistoryModal: {
                isOpen: isExecutionHistoryModalOpen,
                onOpen: handleOpenExecutionHistory,
                onClose: handleCloseExecutionHistory,
            },
        },
    );
    const commandPaletteRequest = {
        isOpen: isCommandPaletteOpen,
        requestedScope: commandPaletteScope,
        requestedMode: commandPaletteMode,
    } as const;
    const commandPaletteContext = {
        workspaceExecutor,
        isSidebarOpen,
        activeSidebarItem,
        theme,
        sidebarPosition,
        isOutlinePanelVisible,
    } as const;
    const commandPaletteActions = {
        onClose: closeCommandPalette,
        onGoToLine: requestGoToLine,
        onOpenWorkspaceScreen: handleOpenWorkspaceScreen,
        onOpenAutomaticExecution: handleOpenAutomaticExecution,
        onOpenScriptLibrary: handleOpenScriptLibrary,
        onOpenAccounts: handleOpenAccounts,
        onOpenExecutionHistory: handleOpenExecutionHistory,
        onToggleSidebar: toggleSidebar,
        onToggleOutlinePanel: toggleOutlinePanel,
        onOpenSettings: handleOpenSettings,
        onSetTheme: setTheme,
        onSetSidebarPosition: setSidebarPosition,
        onZoomIn: handleZoomIn,
        onZoomOut: handleZoomOut,
        onZoomReset: handleZoomReset,
        onRequestRenameCurrentTab: requestRenameCurrentTab,
    } as const;

    useEffect(() => {
        if (activeSidebarItem === "workspace" && hasWorkspace) {
            return;
        }

        setIsExecutionHistoryModalOpen(false);
    }, [activeSidebarItem, hasWorkspace]);

    useAppShellLifecycle({
        hasUnsavedChanges,
        onOpenSettings: handleOpenSettings,
    });
    useAppExitGuard();

    return {
        activeScreen,
        commandPalette: {
            request: commandPaletteRequest,
            context: commandPaletteContext,
            actions: commandPaletteActions,
        },
        isDragActive,
        sidebar: {
            isOpen: isSidebarOpen,
            position: sidebarPosition,
            activeItem: activeSidebarItem,
            showsSettingsUpdateIndicator,
            onSelectItem: selectSidebarItem,
            onToggle: toggleSidebar,
        },
        topbar: {
            workspaceName: shouldShowWorkspaceContext
                ? (workspaceName ?? "None")
                : null,
            workspacePath: shouldShowWorkspaceContext ? workspacePath : null,
            onOpenWorkspace:
                shouldShowWorkspaceContext && workspacePath !== null
                    ? handleOpenWorkspaceDirectory
                    : undefined,
            executorControls:
                activeSidebarItem === "workspace"
                    ? {
                          state: workspaceExecutor.state,
                          actions: workspaceExecutor.actions,
                      }
                    : undefined,
        },
        workspaceExecutor,
    };
}
