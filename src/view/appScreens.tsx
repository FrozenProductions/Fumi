import type { ReactElement } from "react";
import { AccountsScreen } from "../components/accounts/AccountsScreen";
import { AppSettingsScreen } from "../components/app/AppSettingsScreen";
import { AutomaticExecutionScreen } from "../components/automaticExecution/AutomaticExecutionScreen";
import { ScriptLibraryScreen } from "../components/scriptLibrary/ScriptLibraryScreen";
import { WorkspaceScreen } from "../components/workspace/WorkspaceScreen";
import type { WorkspaceScreenProps } from "../components/workspace/workspaceScreen.type";
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
    const { workspace } = workspaceSession.state;

    if (!showsWorkspaceContext(activeSidebarItem)) {
        return {
            workspaceName: null,
            workspacePath: null,
            onOpenWorkspace: undefined,
        };
    }

    return {
        workspaceName: workspace?.workspaceName ?? "None",
        workspacePath: workspace?.workspacePath ?? null,
        onOpenWorkspace: () => {
            void workspaceSession.workspaceActions.openWorkspaceDirectory();
        },
    };
}

export function createAppScreenMap(
    workspaceSession: UseWorkspaceSessionResult,
    workspaceExecutor: UseWorkspaceExecutorResult,
    updater: UseAppUpdaterResult,
    workspaceScreenOverlays: Pick<
        WorkspaceScreenProps,
        "executionHistoryModal"
    >,
): Record<AppSidebarItem, ReactElement> {
    return {
        workspace: (
            <WorkspaceScreen
                session={workspaceSession}
                executor={workspaceExecutor}
                executionHistoryModal={
                    workspaceScreenOverlays.executionHistoryModal
                }
            />
        ),
        "automatic-execution": <AutomaticExecutionScreen />,
        "script-library": (
            <ScriptLibraryScreen workspaceSession={workspaceSession} />
        ),
        accounts: <AccountsScreen />,
        settings: (
            <AppSettingsScreen
                updater={updater}
                workspaceSession={workspaceSession}
            />
        ),
    };
}
