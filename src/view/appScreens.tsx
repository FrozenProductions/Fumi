import type { ReactElement } from "react";
import { AccountsScreen } from "../components/accounts/AccountsScreen";
import { AppSettingsScreen } from "../components/app/AppSettingsScreen";
import { AutomaticExecutionScreen } from "../components/automaticExecution/AutomaticExecutionScreen";
import { ScriptLibraryScreen } from "../components/scriptLibrary/ScriptLibraryScreen";
import { WorkspaceScreen } from "../components/workspace/WorkspaceScreen";
import type { WorkspaceScreenProps } from "../components/workspace/workspaceScreen.type";
import type { UseAppUpdaterResult } from "../hooks/app/useAppUpdater.type";
import type { UseWorkspaceExecutorResult } from "../hooks/workspace/useWorkspaceExecutor.type";
import type { AppSidebarItem } from "../lib/app/app.type";

export function getAppScreen(
    activeSidebarItem: AppSidebarItem,
    workspaceExecutor: UseWorkspaceExecutorResult,
    updater: UseAppUpdaterResult,
    workspaceScreenOverlays: Pick<
        WorkspaceScreenProps,
        "executionHistoryModal"
    >,
): ReactElement {
    switch (activeSidebarItem) {
        case "workspace":
            return (
                <WorkspaceScreen
                    executor={workspaceExecutor}
                    executionHistoryModal={
                        workspaceScreenOverlays.executionHistoryModal
                    }
                />
            );
        case "automatic-execution":
            return (
                <AutomaticExecutionScreen
                    executorKind={workspaceExecutor.state.executorKind}
                />
            );
        case "script-library":
            return <ScriptLibraryScreen />;
        case "accounts":
            return <AccountsScreen />;
        case "settings":
            return <AppSettingsScreen updater={updater} />;
    }
}
