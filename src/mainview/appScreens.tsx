import type { ReactElement } from "react";
import { AppSettingsScreen } from "../components/app/AppSettingsScreen";
import { ScriptLibraryScreen } from "../components/scriptLibrary/ScriptLibraryScreen";
import { WorkspaceScreen } from "../components/workspace/WorkspaceScreen";
import type { UseAppUpdaterResult } from "../hooks/app/useAppUpdater.type";
import type { UseWorkspaceExecutorResult } from "../hooks/workspace/useWorkspaceExecutor.type";
import type { UseWorkspaceSessionResult } from "../hooks/workspace/useWorkspaceSession.type";
import type { AppSidebarItem } from "../lib/app/app.type";
import { showsWorkspaceContext } from "../lib/app/sidebar";
import type { AppTopbarWorkspaceContext } from "./appScreens.type";

export function getAppTopbarWorkspaceContext(
    activeSidebarItem: AppSidebarItem,
    workspaceSession: UseWorkspaceSessionResult,
): AppTopbarWorkspaceContext {
    if (!showsWorkspaceContext(activeSidebarItem)) {
        return {
            workspaceName: null,
            workspacePath: null,
            onOpenWorkspace: undefined,
        };
    }

    return {
        workspaceName: workspaceSession.workspace?.workspaceName ?? "None",
        workspacePath: workspaceSession.workspace?.workspacePath ?? null,
        onOpenWorkspace: () => {
            void workspaceSession.openWorkspaceDirectory();
        },
    };
}

export function renderActiveAppScreen(
    activeSidebarItem: AppSidebarItem,
    workspaceSession: UseWorkspaceSessionResult,
    workspaceExecutor: UseWorkspaceExecutorResult,
    updater: UseAppUpdaterResult,
): ReactElement {
    switch (activeSidebarItem) {
        case "workspace":
            return (
                <WorkspaceScreen
                    session={workspaceSession}
                    executor={workspaceExecutor}
                />
            );
        case "script-library":
            return <ScriptLibraryScreen workspaceSession={workspaceSession} />;
        case "settings":
            return (
                <AppSettingsScreen
                    updater={updater}
                    workspaceSession={workspaceSession}
                />
            );
    }
}
