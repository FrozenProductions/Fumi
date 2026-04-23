import { FileCodeIcon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import type { UseWorkspaceSessionResult } from "../../../../hooks/workspace/useWorkspaceSession.type";
import { splitWorkspaceFileName } from "../../../workspace/fileName";
import type { AppCommandPaletteItem } from "../../app.type";

export function getTabCommandPaletteItems(
    workspaceSession: UseWorkspaceSessionResult,
): AppCommandPaletteItem[] {
    const { activeTab, workspace } = workspaceSession.state;
    const { openWorkspaceDirectory } = workspaceSession.workspaceActions;
    const { selectWorkspaceTab } = workspaceSession.tabActions;

    if (!workspace) {
        return [
            {
                id: "tab-open-workspace",
                label: "Choose workspace",
                description: "Open a folder before searching tabs.",
                icon: FolderOpenIcon,
                keywords: "workspace folder open choose tabs",
                onSelect: () => {
                    void openWorkspaceDirectory();
                },
            },
        ];
    }

    return workspace.tabs.map((tab) => {
        const { baseName } = splitWorkspaceFileName(tab.fileName);
        const isActive = tab.id === workspace.activeTabId;

        return {
            id: `tab-${tab.id}`,
            label: baseName,
            description: "",
            icon: FileCodeIcon,
            keywords: `${tab.fileName} ${workspace.workspaceName} ${
                isActive || activeTab?.id === tab.id
                    ? "active current selected"
                    : ""
            }`,
            onSelect: () => {
                selectWorkspaceTab(tab.id);
            },
        };
    });
}
