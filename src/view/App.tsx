import type { ReactElement } from "react";
import { AppCommandPalette } from "../components/app/commandPalette/AppCommandPalette";
import { AppDragDropOverlay } from "../components/app/shell/AppDragDropOverlay";
import { AppSidebar } from "../components/app/shell/AppSidebar";
import { AppTopbar } from "../components/app/topbar/AppTopbar";
import { APP_TITLE } from "../constants/app/app";
import { AppHotkeysProvider } from "../contexts/app/AppHotkeysProvider";
import { useAppShellController } from "../hooks/app/shell/useAppShellController";

export function App(): ReactElement {
    const shell = useAppShellController();

    return (
        <AppHotkeysProvider workspaceExecutor={shell.workspaceExecutor}>
            <AppDragDropOverlay isVisible={shell.isDragActive} />
            <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[0.95rem] border border-fumi-200 bg-fumi-50 shadow-[var(--shadow-app-shell)]">
                <AppTopbar
                    title={APP_TITLE}
                    isSidebarOpen={shell.sidebar.isOpen}
                    sidebarPosition={shell.sidebar.position}
                    onToggleSidebar={shell.sidebar.onToggle}
                    workspaceName={shell.topbar.workspaceName}
                    workspacePath={shell.topbar.workspacePath}
                    onOpenWorkspace={shell.topbar.onOpenWorkspace}
                    executorControls={shell.topbar.executorControls}
                />
                <div className="flex min-h-0 flex-1 bg-fumi-50">
                    {shell.sidebar.position === "left" ? (
                        <AppSidebar
                            isOpen={shell.sidebar.isOpen}
                            position={shell.sidebar.position}
                            activeItem={shell.sidebar.activeItem}
                            showsSettingsUpdateIndicator={
                                shell.sidebar.showsSettingsUpdateIndicator
                            }
                            onSelectItem={shell.sidebar.onSelectItem}
                        />
                    ) : null}
                    <main className="min-w-0 flex-1 bg-fumi-50">
                        <div className="relative h-full w-full overflow-hidden">
                            <div
                                key={shell.sidebar.activeItem}
                                className="absolute inset-0 h-full w-full"
                            >
                                {shell.activeScreen}
                            </div>
                        </div>
                    </main>
                    {shell.sidebar.position === "right" ? (
                        <AppSidebar
                            isOpen={shell.sidebar.isOpen}
                            position={shell.sidebar.position}
                            activeItem={shell.sidebar.activeItem}
                            showsSettingsUpdateIndicator={
                                shell.sidebar.showsSettingsUpdateIndicator
                            }
                            onSelectItem={shell.sidebar.onSelectItem}
                        />
                    ) : null}
                </div>
                <AppCommandPalette
                    request={shell.commandPalette.request}
                    context={shell.commandPalette.context}
                    actions={shell.commandPalette.actions}
                />
            </div>
        </AppHotkeysProvider>
    );
}
