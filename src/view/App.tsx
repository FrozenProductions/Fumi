import type { ReactElement } from "react";
import { AppCommandPalette } from "../components/app/AppCommandPalette";
import { AppSidebar } from "../components/app/AppSidebar";
import { AppTopbar } from "../components/app/AppTopbar";
import { APP_TITLE } from "../constants/app/app";
import { AppHotkeysProvider } from "../contexts/app/AppHotkeysProvider";
import { useAppShellLifecycle } from "../hooks/app/useAppShellLifecycle";
import { useAppStore } from "../hooks/app/useAppStore";
import { useAppThemeSync } from "../hooks/app/useAppThemeSync";
import { useAppUpdater } from "../hooks/app/useAppUpdater";
import { useAppZoomSync } from "../hooks/app/useAppZoomSync";
import { useWorkspaceExecutor } from "../hooks/workspace/useWorkspaceExecutor";
import { useWorkspaceSession } from "../hooks/workspace/useWorkspaceSession";
import { useWorkspaceStoreLifecycle } from "../hooks/workspace/useWorkspaceStoreLifecycle";
import {
    getAppTopbarWorkspaceContext,
    renderActiveAppScreen,
} from "./appScreens";

export function App(): ReactElement {
    useWorkspaceStoreLifecycle();
    useAppThemeSync();
    useAppZoomSync();
    const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
    const isCommandPaletteOpen = useAppStore(
        (state) => state.isCommandPaletteOpen,
    );
    const commandPaletteScope = useAppStore(
        (state) => state.commandPaletteScope,
    );
    const commandPaletteMode = useAppStore((state) => state.commandPaletteMode);
    const activeSidebarItem = useAppStore((state) => state.activeSidebarItem);
    const closeCommandPalette = useAppStore(
        (state) => state.closeCommandPalette,
    );
    const requestGoToLine = useAppStore((state) => state.requestGoToLine);
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);
    const selectSidebarItem = useAppStore((state) => state.selectSidebarItem);
    const updater = useAppUpdater();
    const showsSettingsUpdateIndicator =
        import.meta.env.DEV || updater.availableUpdate !== null;
    const workspaceSession = useWorkspaceSession();
    const workspaceExecutor = useWorkspaceExecutor({
        activeTabContent: workspaceSession.activeTab?.content ?? null,
    });
    const { hasUnsavedChanges } = workspaceSession;
    const handleOpenSettings = (): void => {
        selectSidebarItem("settings");
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
                            ? workspaceExecutor
                            : undefined
                    }
                />
                <div className="flex min-h-0 flex-1 bg-fumi-50">
                    <AppSidebar
                        isOpen={isSidebarOpen}
                        activeItem={activeSidebarItem}
                        showsSettingsUpdateIndicator={
                            showsSettingsUpdateIndicator
                        }
                        onSelectItem={selectSidebarItem}
                    />
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
                </div>
                <AppCommandPalette
                    isOpen={isCommandPaletteOpen}
                    requestedScope={commandPaletteScope}
                    requestedMode={commandPaletteMode}
                    workspaceSession={workspaceSession}
                    isSidebarOpen={isSidebarOpen}
                    onClose={closeCommandPalette}
                    onGoToLine={requestGoToLine}
                    onToggleSidebar={toggleSidebar}
                    onOpenSettings={handleOpenSettings}
                />
            </div>
        </AppHotkeysProvider>
    );
}
