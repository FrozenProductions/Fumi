import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type { AppCommandPaletteItem } from "../../lib/app/app.type";
import {
    createWorkspaceCountLabel,
    formatWorkspacePath,
    getWorkspacePathLabel,
} from "./commandPaletteShared";

export function getWorkspaceCommandPaletteItems(
    workspaceSession: UseWorkspaceSessionResult,
): AppCommandPaletteItem[] {
    const { recentWorkspacePaths, workspace } = workspaceSession.state;
    const { openWorkspaceDirectory, openWorkspacePath } =
        workspaceSession.workspaceActions;
    const recentWorkspaceItems = recentWorkspacePaths
        .filter((workspacePath) => workspacePath !== workspace?.workspacePath)
        .map((workspacePath) => ({
            id: `workspace-recent-${workspacePath}`,
            label: getWorkspacePathLabel(workspacePath),
            description: "Switch to this recent workspace.",
            icon: FolderOpenIcon,
            meta: formatWorkspacePath(workspacePath),
            keywords: `${workspacePath} ${getWorkspacePathLabel(
                workspacePath,
            )} recent workspace switch open`,
            onSelect: () => {
                void openWorkspacePath(workspacePath);
            },
        }));

    return [
        {
            id: "workspace-folder",
            label: workspace?.workspaceName ?? "Choose workspace",
            description: workspace
                ? createWorkspaceCountLabel(
                      workspace.tabs.length,
                      workspace.archivedTabs.length,
                  )
                : "Open a folder to begin working with tabs.",
            icon: FolderOpenIcon,
            meta: formatWorkspacePath(workspace?.workspacePath),
            keywords: `${workspace?.workspaceName ?? ""} ${
                workspace?.workspacePath ?? ""
            } folder workspace current`,
            onSelect: () => {
                void openWorkspaceDirectory();
            },
        },
        ...recentWorkspaceItems,
    ];
}
