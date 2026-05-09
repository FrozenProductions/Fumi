import type { ReactElement } from "react";
import { AccountsScreen } from "../components/accounts/AccountsScreen";
import { AppSettingsScreen } from "../components/app/settings/AppSettingsScreen";
import { AutomaticExecutionScreen } from "../components/automaticExecution/AutomaticExecutionScreen";
import { ScriptLibraryScreen } from "../components/scriptLibrary/ScriptLibraryScreen";
import { WorkspaceScreen } from "../components/workspace/WorkspaceScreen";
import type { WorkspaceScreenProps } from "../components/workspace/workspaceScreen.type";
import type { UseAppUpdaterResult } from "../hooks/app/useAppUpdater.type";
import type { AppSidebarItem } from "../lib/app/sidebar.type";
import type { UseWorkspaceExecutorResult } from "../lib/workspace/executor/executor.type";

/**
 * Resolves the active sidebar item to its corresponding screen component.
 *
 * @param activeSidebarItem - The currently selected sidebar navigation item
 * @param workspaceExecutor - Workspace executor state and actions
 * @param updater - App updater state and actions
 * @param workspaceScreenOverlays - Overlay props for the workspace screen
 * @returns The React element for the active screen
 */
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
