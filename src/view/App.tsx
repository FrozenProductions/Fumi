import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { AppCommandPalette } from "../components/app/AppCommandPalette";
import { AppDragDropOverlay } from "../components/app/AppDragDropOverlay";
import { AppSidebar } from "../components/app/AppSidebar";
import { AppTopbar } from "../components/app/AppTopbar";
import { APP_TITLE } from "../constants/app/app";
import { APP_ZOOM_DEFAULT, APP_ZOOM_STEP } from "../constants/app/settings";
import { AppHotkeysProvider } from "../contexts/app/AppHotkeysProvider";
import { useAppDragDrop } from "../hooks/app/useAppDragDrop";
import { useAppExitGuard } from "../hooks/app/useAppExitGuard";
import { useAppShellLifecycle } from "../hooks/app/useAppShellLifecycle";
import { useAppStore } from "../hooks/app/useAppStore";
import { useAppThemeSync } from "../hooks/app/useAppThemeSync";
import { useAppUpdater } from "../hooks/app/useAppUpdater";
import { useAppZoomSync } from "../hooks/app/useAppZoomSync";
import {
    selectAutomaticExecutionHasUnsavedChanges,
    useAutomaticExecutionStore,
} from "../hooks/automaticExecution/useAutomaticExecutionStore";
import { useWorkspaceDroppedFiles } from "../hooks/workspace/useWorkspaceDroppedFiles";
import { useWorkspaceExecutor } from "../hooks/workspace/useWorkspaceExecutor";
import { useWorkspaceStore } from "../hooks/workspace/useWorkspaceStore";
import { useWorkspaceStoreLifecycle } from "../hooks/workspace/useWorkspaceStoreLifecycle";
import { showsWorkspaceContext } from "../lib/app/sidebar";
import { selectWorkspaceHasUnsavedChanges } from "../lib/workspace/store/selectors";
import { getAppScreen } from "./appScreens";

export function App(): ReactElement {
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
    const zoomPercent = useAppStore((state) => state.zoomPercent);
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
    const setZoomPercent = useAppStore((state) => state.setZoomPercent);
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
    const handleZoomIn = (): void => {
        setZoomPercent(zoomPercent + APP_ZOOM_STEP);
    };
    const handleZoomOut = (): void => {
        setZoomPercent(zoomPercent - APP_ZOOM_STEP);
    };
    const handleZoomReset = (): void => {
        setZoomPercent(APP_ZOOM_DEFAULT);
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
    const shouldShowWorkspaceContext = showsWorkspaceContext(activeSidebarItem);
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

    return (
        <AppHotkeysProvider>
            <AppDragDropOverlay isVisible={isDragActive} />
            <div className="relative flex h-screen flex-col overflow-hidden rounded-[0.95rem] border border-fumi-200 bg-fumi-50 shadow-[var(--shadow-app-shell)]">
                <AppTopbar
                    title={APP_TITLE}
                    isSidebarOpen={isSidebarOpen}
                    sidebarPosition={sidebarPosition}
                    onToggleSidebar={toggleSidebar}
                    workspaceName={
                        shouldShowWorkspaceContext
                            ? (workspaceName ?? "None")
                            : null
                    }
                    workspacePath={
                        shouldShowWorkspaceContext ? workspacePath : null
                    }
                    onOpenWorkspace={
                        shouldShowWorkspaceContext && workspacePath !== null
                            ? () => {
                                  void openWorkspaceDirectory();
                              }
                            : undefined
                    }
                    executorControls={
                        activeSidebarItem === "workspace"
                            ? {
                                  state: workspaceExecutor.state,
                                  actions: workspaceExecutor.actions,
                              }
                            : undefined
                    }
                />
                <div className="flex min-h-0 flex-1 bg-fumi-50">
                    {sidebarPosition === "left" ? (
                        <AppSidebar
                            isOpen={isSidebarOpen}
                            position={sidebarPosition}
                            activeItem={activeSidebarItem}
                            showsSettingsUpdateIndicator={
                                showsSettingsUpdateIndicator
                            }
                            onSelectItem={selectSidebarItem}
                        />
                    ) : null}
                    <main className="min-w-0 flex-1 bg-fumi-50">
                        <div className="relative h-full w-full overflow-hidden">
                            <div
                                key={activeSidebarItem}
                                className="absolute inset-0 h-full w-full"
                            >
                                {activeScreen}
                            </div>
                        </div>
                    </main>
                    {sidebarPosition === "right" ? (
                        <AppSidebar
                            isOpen={isSidebarOpen}
                            position={sidebarPosition}
                            activeItem={activeSidebarItem}
                            showsSettingsUpdateIndicator={
                                showsSettingsUpdateIndicator
                            }
                            onSelectItem={selectSidebarItem}
                        />
                    ) : null}
                </div>
                <AppCommandPalette
                    request={commandPaletteRequest}
                    context={commandPaletteContext}
                    actions={commandPaletteActions}
                />
            </div>
        </AppHotkeysProvider>
    );
}
