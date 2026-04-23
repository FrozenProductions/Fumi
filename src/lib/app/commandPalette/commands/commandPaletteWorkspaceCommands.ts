import { CommandIcon } from "@hugeicons/core-free-icons";
import type { GetCommandPaletteCommandItemsOptions } from "../commandPalette.type";
import type { AppCommandPaletteItem } from "../commandPaletteDomain.type";

type CommandPaletteWorkspaceOptions = Pick<
    GetCommandPaletteCommandItemsOptions,
    | "hotkeyLabels"
    | "onOpenExecutionHistory"
    | "onOpenWorkspaceScreen"
    | "workspaceSession"
>;

export function getWorkspaceCommandItems({
    hotkeyLabels,
    onOpenExecutionHistory,
    onOpenWorkspaceScreen,
    workspaceSession,
}: CommandPaletteWorkspaceOptions): AppCommandPaletteItem[] {
    const { workspace } = workspaceSession.state;
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
    ];
}
