import { CommandIcon } from "@hugeicons/core-free-icons";
import type { GetCommandPaletteCommandItemsOptions } from "../commandPalette.type";
import type { AppCommandPaletteItem } from "../commandPaletteDomain.type";

type CommandPaletteWorkspaceOptions = Pick<
    GetCommandPaletteCommandItemsOptions,
    | "hotkeyLabels"
    | "onActivateArchivedTabMode"
    | "onActivateDeleteArchivedTabMode"
    | "onOpenExecutionHistory"
    | "onOpenWorkspaceScreen"
    | "workspaceSession"
>;

/** Builds command palette items for workspace-level actions like execution history and file creation. */
export function getWorkspaceCommandItems({
    hotkeyLabels,
    onActivateArchivedTabMode,
    onActivateDeleteArchivedTabMode,
    onOpenExecutionHistory,
    onOpenWorkspaceScreen,
    workspaceSession,
}: CommandPaletteWorkspaceOptions): AppCommandPaletteItem[] {
    const { workspace } = workspaceSession.state;
    const { deleteAllArchivedWorkspaceTabs, restoreAllArchivedWorkspaceTabs } =
        workspaceSession.archiveActions;
    const { createWorkspaceFile } = workspaceSession.workspaceActions;

    if (!workspace) {
        return [];
    }

    return [
        {
            id: "command-open-execution-history",
            label: "Open execution history",
            description:
                "Inspect successful manual executes for this workspace.",
            icon: CommandIcon,
            keywords: "execution history execute run replay script workspace",
            onSelect: () => {
                onOpenWorkspaceScreen();
                onOpenExecutionHistory();
            },
        },
        {
            id: "command-create-file",
            label: "Create new file",
            description: "Add a fresh script tab to the current workspace.",
            icon: CommandIcon,
            meta: hotkeyLabels.createWorkspaceFile,
            keywords: "new create file tab script",
            onSelect: () => {
                void createWorkspaceFile();
            },
        },
        {
            id: "command-restore-archived-tab",
            label: "Restore archived tab",
            description:
                workspace.archivedTabs.length === 0
                    ? "No archived tabs are available to restore."
                    : "Choose an archived tab to restore.",
            icon: CommandIcon,
            keywords: "restore archived tab reopen closed file",
            closeOnSelect: false,
            isDisabled: workspace.archivedTabs.length === 0,
            onSelect: onActivateArchivedTabMode,
        },
        {
            id: "command-restore-all-archived-tabs",
            label: "Restore all archived tabs",
            description:
                workspace.archivedTabs.length === 0
                    ? "No archived tabs are available to restore."
                    : "Restore every archived tab to this workspace.",
            icon: CommandIcon,
            keywords: "restore all archived tabs reopen closed files",
            isDisabled: workspace.archivedTabs.length === 0,
            onSelect: () => {
                onOpenWorkspaceScreen();
                void restoreAllArchivedWorkspaceTabs();
            },
        },
        {
            id: "command-delete-archived-tab",
            label: "Delete archived tab",
            description:
                workspace.archivedTabs.length === 0
                    ? "No archived tabs are available to delete."
                    : "Choose an archived tab to permanently delete.",
            icon: CommandIcon,
            keywords: "delete archived tab remove permanent file",
            closeOnSelect: false,
            isDisabled: workspace.archivedTabs.length === 0,
            onSelect: onActivateDeleteArchivedTabMode,
        },
        {
            id: "command-delete-all-archived-tabs",
            label: "Delete all archived tabs",
            description:
                workspace.archivedTabs.length === 0
                    ? "No archived tabs are available to delete."
                    : "Permanently delete every archived tab.",
            icon: CommandIcon,
            keywords: "delete all archived tabs remove permanent files",
            isDisabled: workspace.archivedTabs.length === 0,
            onSelect: () => {
                onOpenWorkspaceScreen();
                void deleteAllArchivedWorkspaceTabs();
            },
        },
    ];
}
