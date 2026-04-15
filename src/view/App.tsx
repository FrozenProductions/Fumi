import type { ReactElement } from "react";
import { AppCommandPalette } from "../components/app/AppCommandPalette";
import { AppDragDropOverlay } from "../components/app/AppDragDropOverlay";
import { AppSidebar } from "../components/app/AppSidebar";
import { AppTopbar } from "../components/app/AppTopbar";
import { APP_TITLE } from "../constants/app/app";
import { APP_ZOOM_DEFAULT, APP_ZOOM_STEP } from "../constants/app/settings";
import { AppHotkeysProvider } from "../contexts/app/AppHotkeysProvider";
import { useAppDragDrop } from "../hooks/app/useAppDragDrop";
import { useAppShellLifecycle } from "../hooks/app/useAppShellLifecycle";
import { useAppStore } from "../hooks/app/useAppStore";
import { useAppThemeSync } from "../hooks/app/useAppThemeSync";
import { useAppUpdater } from "../hooks/app/useAppUpdater";
import { useAppZoomSync } from "../hooks/app/useAppZoomSync";
import { useWorkspaceDroppedFiles } from "../hooks/workspace/useWorkspaceDroppedFiles";
import { useWorkspaceExecutor } from "../hooks/workspace/useWorkspaceExecutor";
import { useWorkspaceSession } from "../hooks/workspace/useWorkspaceSession";
import { useWorkspaceStoreLifecycle } from "../hooks/workspace/useWorkspaceStoreLifecycle";
import {
    getAppTopbarWorkspaceContext,
    renderActiveAppScreen,
} from "./appScreens";

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
    const workspaceSession = useWorkspaceSession();
    const { activeTab, hasUnsavedChanges } = workspaceSession.state;
    const workspaceExecutor = useWorkspaceExecutor({
        activeTabContent: activeTab?.content ?? null,
    });
    const handleOpenSettings = (): void => {
        selectSidebarItem("settings");
    };
    const handleOpenWorkspaceScreen = (): void => {
        selectSidebarItem("workspace");
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
    const topbarWorkspaceContext = getAppTopbarWorkspaceContext(
        activeSidebarItem,
        workspaceSession,
    );

    useAppShellLifecycle({
        hasUnsavedChanges,
        onOpenSettings: handleOpenSettings,
    });

    return (
        <AppHotkeysProvider workspaceSession={workspaceSession}>
            <AppDragDropOverlay isVisible={isDragActive} />
            <div className="relative flex h-screen flex-col overflow-hidden rounded-[0.95rem] border border-fumi-200 bg-fumi-50 shadow-[var(--shadow-app-shell)]">
                <AppTopbar
                    title={APP_TITLE}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                    workspaceName={topbarWorkspaceContext.workspaceName}
                    workspacePath={topbarWorkspaceContext.workspacePath}
                    onOpenWorkspace={topbarWorkspaceContext.onOpenWorkspace}
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
                        <div
                            key={activeSidebarItem}
                            className="h-full w-full animate-slide-in"
                        >
                            {renderActiveAppScreen(
                                activeSidebarItem,
                                workspaceSession,
                                workspaceExecutor,
                                updater,
                            )}
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
                    isOpen={isCommandPaletteOpen}
                    requestedScope={commandPaletteScope}
                    requestedMode={commandPaletteMode}
                    workspaceSession={workspaceSession}
                    workspaceExecutor={workspaceExecutor}
                    isSidebarOpen={isSidebarOpen}
                    activeSidebarItem={activeSidebarItem}
                    theme={theme}
                    sidebarPosition={sidebarPosition}
                    onClose={closeCommandPalette}
                    onGoToLine={requestGoToLine}
                    onOpenWorkspaceScreen={handleOpenWorkspaceScreen}
                    onOpenScriptLibrary={handleOpenScriptLibrary}
                    onOpenAccounts={handleOpenAccounts}
                    onToggleSidebar={toggleSidebar}
                    onToggleOutlinePanel={toggleOutlinePanel}
                    onOpenSettings={handleOpenSettings}
                    isOutlinePanelVisible={isOutlinePanelVisible}
                    onSetTheme={setTheme}
                    onSetSidebarPosition={setSidebarPosition}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomReset={handleZoomReset}
                    onRequestRenameCurrentTab={requestRenameCurrentTab}
                />
            </div>
        </AppHotkeysProvider>
    );
}
