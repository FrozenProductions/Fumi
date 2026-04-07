import {
    CommandIcon,
    FileCodeIcon,
    FolderOpenIcon,
} from "@hugeicons/core-free-icons";
import { APP_HOTKEYS } from "../../constants/app/hotkeys";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type { AppCommandPaletteItem } from "../../lib/app/app.type";
import { splitWorkspaceFileName } from "../workspace/fileName";
import type {
    GetCommandPaletteCommandItemsOptions,
    GetGoToLineCommandPaletteItemsOptions,
} from "./commandPalette.type";

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
    workspaceExecutor,
    isSidebarOpen,
    activeSidebarItem,
    theme,
    onActivateGoToLineMode,
    onOpenWorkspaceScreen,
    onOpenScriptLibrary,
    onOpenSettings,
    onToggleSidebar,
    onSetTheme,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onRequestRenameCurrentTab,
}: GetCommandPaletteCommandItemsOptions): AppCommandPaletteItem[] {
    const { activeTab, workspace } = workspaceSession;
    const commandItems: AppCommandPaletteItem[] = [
        {
            id: "command-open-workspace-screen",
            label: "Open Workspace",
            description: "Show your tabs and editor.",
            icon: CommandIcon,
            meta: getCurrentStateMeta(
                activeSidebarItem === "workspace",
                APP_HOTKEYS.OPEN_WORKSPACE_SCREEN.label,
            ),
            keywords: "workspace editor tabs files screen",
            isDisabled: activeSidebarItem === "workspace",
            onSelect: onOpenWorkspaceScreen,
        },
        {
            id: "command-open-script-library",
            label: "Open Script Library",
            description: "Browse and import scripts from Rscripts.net.",
            icon: CommandIcon,
            meta: getCurrentStateMeta(
                activeSidebarItem === "script-library",
                APP_HOTKEYS.OPEN_SCRIPT_LIBRARY.label,
            ),
            keywords: "script library browse import rscripts",
            isDisabled: activeSidebarItem === "script-library",
            onSelect: onOpenScriptLibrary,
        },
        {
            id: "command-settings",
            label: "Open settings",
            description: "Adjust editor, theme, and app preferences.",
            icon: CommandIcon,
            meta: getCurrentStateMeta(
                activeSidebarItem === "settings",
                APP_HOTKEYS.OPEN_SETTINGS.label,
            ),
            keywords: "settings preferences configuration",
            isDisabled: activeSidebarItem === "settings",
            onSelect: onOpenSettings,
        },
        {
            id: "command-open-workspace-folder",
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
            id: "command-zoom-in",
            label: "Zoom in",
            description: "Increase the app scale for this window.",
            icon: CommandIcon,
            keywords: "zoom in increase scale",
            onSelect: onZoomIn,
        },
        {
            id: "command-zoom-out",
            label: "Zoom out",
            description: "Decrease the app scale for this window.",
            icon: CommandIcon,
            keywords: "zoom out decrease scale",
            onSelect: onZoomOut,
        },
        {
            id: "command-zoom-reset",
            label: "Reset zoom",
            description: "Return the app scale to the default size.",
            icon: CommandIcon,
            keywords: "zoom reset actual size default scale",
            onSelect: onZoomReset,
        },
        {
            id: "command-theme-light",
            label: "Set theme: Light",
            description: "Switch the app to the light theme.",
            icon: CommandIcon,
            meta: getCurrentStateMeta(theme === "light"),
            keywords: "theme appearance light",
            isDisabled: theme === "light",
            onSelect: () => {
                onSetTheme("light");
            },
        },
        {
            id: "command-theme-dark",
            label: "Set theme: Dark",
            description: "Switch the app to the dark theme.",
            icon: CommandIcon,
            meta: getCurrentStateMeta(theme === "dark"),
            keywords: "theme appearance dark",
            isDisabled: theme === "dark",
            onSelect: () => {
                onSetTheme("dark");
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
            id: "command-execute-tab",
            label: "Execute active tab",
            description: `Run ${activeTab.fileName} through the executor.`,
            icon: CommandIcon,
            keywords: `execute run script ${activeTab.fileName}`,
            onSelect: () => {
                void workspaceExecutor.executeActiveTab();
            },
        },
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
            id: "command-rename-tab",
            label: "Rename current tab",
            description: `Rename ${activeTab.fileName} in the tab bar.`,
            icon: CommandIcon,
            keywords: `rename edit file name ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                onRequestRenameCurrentTab();
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
        {
            id: "command-delete-tab",
            label: "Delete current tab",
            description: `Permanently remove ${activeTab.fileName} from the workspace.`,
            icon: CommandIcon,
            keywords: `delete remove file ${activeTab.fileName}`,
            onSelect: () => {
                void workspaceSession.deleteWorkspaceTab(activeTab.id);
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

function getCurrentStateMeta(
    isCurrent: boolean,
    fallbackMeta?: string,
): string | undefined {
    if (isCurrent) {
        return "Current";
    }

    return fallbackMeta;
}
