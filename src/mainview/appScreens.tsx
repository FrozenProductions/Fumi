import type { ReactElement } from "react";
import { ScriptLibraryScreen } from "../components/scriptLibrary/ScriptLibraryScreen";
import { WorkspaceScreen } from "../components/workspace/WorkspaceScreen";
import type { UseWorkspaceExecutorResult } from "../hooks/workspace/useWorkspaceExecutor";
import { showsWorkspaceContext } from "../lib/app/sidebar";
import type { AppSidebarItem } from "../types/app/sidebar";
import type { UseWorkspaceSessionResult } from "../types/workspace/session";

type AppTopbarWorkspaceContext = {
    workspaceName: string | null;
    workspacePath: string | null;
    onOpenWorkspace: (() => void) | undefined;
};

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
    }
}
