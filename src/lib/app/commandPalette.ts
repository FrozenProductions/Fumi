import {
    CommandIcon,
    FileCodeIcon,
    FolderOpenIcon,
} from "@hugeicons/core-free-icons";
import { APP_HOTKEYS } from "../../constants/app/hotkeys";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type { AppCommandPaletteItem } from "../../lib/app/app.type";
import type { WorkspaceTab } from "../../lib/workspace/workspace.type";
import { splitWorkspaceFileName } from "../workspace/fileName";

type GetCommandPaletteCommandItemsOptions = {
    workspaceSession: UseWorkspaceSessionResult;
    isSidebarOpen: boolean;
    onActivateGoToLineMode: () => void;
    onOpenSettings: () => void;
    onToggleSidebar: () => void;
};

type GetGoToLineCommandPaletteItemsOptions = {
    activeTab: WorkspaceTab | null;
    goToLineNumber: number | null;
    onGoToLine: (lineNumber: number) => void;
};

export function normalizeAppCommandPaletteSearchValue(value: string): string {
    return value.trim().toLowerCase();
}

export function parseGoToLineQuery(value: string): number | null {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const match = trimmedValue.match(
        /^(?::|line\s+|go\s+to\s+line\s+)?(\d+)(?::\d+)?$/i,
    );

    if (!match) {
        return null;
    }

    const lineNumber = Number.parseInt(match[1], 10);

    return Number.isInteger(lineNumber) && lineNumber > 0 ? lineNumber : null;
}

export function matchesAppCommandPaletteItem(
    item: AppCommandPaletteItem,
    searchValue: string,
): boolean {
    if (!searchValue) {
        return true;
    }

    return normalizeAppCommandPaletteSearchValue(
        `${item.label} ${item.description} ${item.keywords} ${item.meta ?? ""}`,
    ).includes(searchValue);
}

export function getTabCommandPaletteItems(
    workspaceSession: UseWorkspaceSessionResult,
): AppCommandPaletteItem[] {
    const workspace = workspaceSession.workspace;

    if (!workspace) {
        return [
            {
                id: "tab-open-workspace",
                label: "Choose workspace",
                description: "Open a folder before searching tabs.",
                icon: FolderOpenIcon,
                keywords: "workspace folder open choose tabs",
                onSelect: () => {
                    void workspaceSession.openWorkspaceDirectory();
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
                isActive ? "active current selected" : ""
            }`,
            onSelect: () => {
                workspaceSession.selectWorkspaceTab(tab.id);
            },
        };
    });
}

export function getCommandCommandPaletteItems({
    workspaceSession,
    isSidebarOpen,
    onActivateGoToLineMode,
    onOpenSettings,
    onToggleSidebar,
}: GetCommandPaletteCommandItemsOptions): AppCommandPaletteItem[] {
    const { activeTab, workspace } = workspaceSession;
    const commandItems: AppCommandPaletteItem[] = [
        {
            id: "command-sidebar",
            label: isSidebarOpen ? "Close sidebar" : "Open sidebar",
            description: "Toggle the main navigation rail.",
            icon: CommandIcon,
            meta: APP_HOTKEYS.TOGGLE_SIDEBAR.label,
            keywords: "sidebar navigation toggle panel",
            onSelect: onToggleSidebar,
        },
        {
            id: "command-settings",
            label: "Open settings",
            description: "Adjust editor, theme, and app preferences.",
            icon: CommandIcon,
            meta: APP_HOTKEYS.OPEN_SETTINGS.label,
            keywords: "settings preferences configuration",
            onSelect: onOpenSettings,
        },
        {
            id: "command-open-workspace",
            label: workspace ? "Switch workspace folder" : "Choose workspace",
            description: workspace
                ? "Pick a different folder for your scripts."
                : "Pick a folder to start editing scripts.",
            icon: CommandIcon,
            meta: APP_HOTKEYS.OPEN_WORKSPACE_DIRECTORY.label,
            keywords: "workspace folder open choose switch",
            onSelect: () => {
                void workspaceSession.openWorkspaceDirectory();
            },
        },
    ];

    if (workspace) {
        commandItems.push({
            id: "command-create-file",
            label: "Create new file",
            description: "Add a fresh script tab to the current workspace.",
            icon: CommandIcon,
            meta: APP_HOTKEYS.CREATE_WORKSPACE_FILE.label,
            keywords: "new create file tab script",
            onSelect: () => {
                void workspaceSession.createWorkspaceFile();
            },
        });
    }

    if (!activeTab) {
        return commandItems;
    }

    commandItems.push(
        {
            id: "command-goto-line",
            label: "Go to line",
            description: `Jump to a specific line in ${activeTab.fileName}.`,
            icon: CommandIcon,
            meta: APP_HOTKEYS.ACTIVATE_GOTO_LINE_COMMAND.label,
            keywords: `goto go to jump line ${activeTab.fileName} current tab`,
            closeOnSelect: false,
            onSelect: onActivateGoToLineMode,
        },
        {
            id: "command-save-tab",
            label: "Save current tab",
            description: `Write ${activeTab.fileName} to disk.`,
            icon: CommandIcon,
            keywords: `save write ${activeTab.fileName}`,
            onSelect: () => {
                void workspaceSession.saveActiveWorkspaceTab();
            },
        },
        {
            id: "command-archive-tab",
            label: "Archive current tab",
            description: `Archive ${activeTab.fileName} from the tab bar.`,
            icon: CommandIcon,
            meta: APP_HOTKEYS.ARCHIVE_WORKSPACE_TAB.label,
            keywords: `archive close remove ${activeTab.fileName}`,
            onSelect: () => {
                void workspaceSession.archiveWorkspaceTab(activeTab.id);
            },
        },
    );

    return commandItems;
}

export function getWorkspaceCommandPaletteItems(
    workspaceSession: UseWorkspaceSessionResult,
): AppCommandPaletteItem[] {
    const { recentWorkspacePaths, workspace } = workspaceSession;
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
                void workspaceSession.openWorkspacePath(workspacePath);
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
                void workspaceSession.openWorkspaceDirectory();
            },
        },
        ...recentWorkspaceItems,
    ];
}

export function getGoToLineCommandPaletteItems({
    activeTab,
    goToLineNumber,
    onGoToLine,
}: GetGoToLineCommandPaletteItemsOptions): AppCommandPaletteItem[] {
    if (!activeTab) {
        return [];
    }

    return [
        {
            id: "command-goto-line",
            label:
                goToLineNumber === null
                    ? "Go to line"
                    : `Go to line ${goToLineNumber}`,
            description:
                goToLineNumber === null
                    ? `Type a line number for ${activeTab.fileName}.`
                    : `Jump within ${activeTab.fileName}.`,
            icon: CommandIcon,
            keywords: `goto go to jump line ${activeTab.fileName}`,
            isDisabled: goToLineNumber === null,
            onSelect: () => {
                if (goToLineNumber === null) {
                    return;
                }

                onGoToLine(goToLineNumber);
            },
        },
    ];
}

function formatWorkspacePath(
    value: string | null | undefined,
): string | undefined {
    if (!value) {
        return undefined;
    }

    return value.replace(/^\/Users\/[^/]+/, "~").replace(/^\/home\/[^/]+/, "~");
}

function getWorkspacePathLabel(workspacePath: string): string {
    const pathSegments = workspacePath.split(/[/\\]/).filter(Boolean);

    return pathSegments[pathSegments.length - 1] ?? workspacePath;
}

function createWorkspaceCountLabel(
    tabCount: number,
    archivedTabCount: number,
): string {
    return `${tabCount} tab${tabCount === 1 ? "" : "s"} • ${archivedTabCount} archived`;
}
