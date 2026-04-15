import {
    CommandIcon,
    FileCodeIcon,
    FolderOpenIcon,
} from "@hugeicons/core-free-icons";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type { AppCommandPaletteItem } from "../../lib/app/app.type";
import { killRobloxProcesses, launchRoblox } from "../../lib/platform/accounts";
import { confirmAction } from "../../lib/platform/dialog";
import { isTauriEnvironment } from "../../lib/platform/runtime";
import { splitWorkspaceFileName } from "../workspace/fileName";
import type {
    GetCommandPaletteCommandItemsOptions,
    GetGoToLineCommandPaletteItemsOptions,
    GetThemeCommandPaletteItemsOptions,
} from "./commandPalette.type";

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

export function getCommandCommandPaletteItems({
    workspaceSession,
    workspaceExecutor,
    isSidebarOpen,
    activeSidebarItem,
    sidebarPosition,
    hotkeyLabels,
    onActivateGoToLineMode,
    onActivateThemeMode,
    onOpenWorkspaceScreen,
    onOpenScriptLibrary,
    onOpenAccounts,
    onOpenSettings,
    onToggleSidebar,
    onToggleOutlinePanel,
    onSetSidebarPosition,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onRequestRenameCurrentTab,
    isOutlinePanelVisible,
}: GetCommandPaletteCommandItemsOptions): AppCommandPaletteItem[] {
    const { activeTab, workspace } = workspaceSession.state;
    const { openWorkspaceDirectory, createWorkspaceFile } =
        workspaceSession.workspaceActions;
    const {
        archiveWorkspaceTab,
        deleteWorkspaceTab,
        duplicateWorkspaceTab,
        saveActiveWorkspaceTab,
        resetWorkspaceSplitView,
        toggleWorkspaceSplitView,
        openWorkspaceTabInPane,
        focusWorkspacePane,
    } = workspaceSession.tabActions;
    const { splitView } = workspaceSession.state.workspace ?? {};
    const executorState = workspaceExecutor.state;
    const { executeActiveTab } = workspaceExecutor.actions;
    const isDesktopShell = isTauriEnvironment();
    const commandItems: AppCommandPaletteItem[] = [
        {
            id: "command-open-workspace-screen",
            label: "Open Workspace",
            description: "Show your tabs and editor.",
            icon: CommandIcon,
            meta: getCurrentStateMeta(
                activeSidebarItem === "workspace",
                hotkeyLabels.openWorkspaceScreen,
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
                hotkeyLabels.openScriptLibrary,
            ),
            keywords: "script library browse import rscripts",
            isDisabled: activeSidebarItem === "script-library",
            onSelect: onOpenScriptLibrary,
        },
        {
            id: "command-open-accounts",
            label: "Open Accounts",
            description: "Manage saved Roblox accounts and launch them.",
            icon: CommandIcon,
            meta: getCurrentStateMeta(
                activeSidebarItem === "accounts",
                hotkeyLabels.openAccounts,
            ),
            keywords: "accounts roblox cookies launch manager",
            isDisabled: activeSidebarItem === "accounts",
            onSelect: onOpenAccounts,
        },
        {
            id: "command-settings",
            label: "Open settings",
            description: "Adjust editor, theme, and app preferences.",
            icon: CommandIcon,
            meta: getCurrentStateMeta(
                activeSidebarItem === "settings",
                hotkeyLabels.openSettings,
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
            meta: hotkeyLabels.openWorkspaceDirectory,
            keywords: "workspace folder open choose switch",
            onSelect: () => {
                void openWorkspaceDirectory();
            },
        },
        {
            id: "command-launch-roblox",
            label: "Launch Roblox",
            description: isDesktopShell
                ? "Start a Roblox client from the desktop app."
                : "Roblox controls require the Tauri desktop shell.",
            icon: CommandIcon,
            meta: hotkeyLabels.launchRoblox,
            keywords: "roblox launch start open player client",
            isDisabled: !isDesktopShell,
            onSelect: () => {
                onOpenWorkspaceScreen();
                void launchRoblox();
            },
        },
        {
            id: "command-kill-roblox",
            label: "Kill Roblox",
            description: isDesktopShell
                ? "Attempt to close Roblox after confirmation."
                : "Roblox controls require the Tauri desktop shell.",
            icon: CommandIcon,
            meta: hotkeyLabels.killRoblox,
            keywords: "roblox kill close terminate quit player client",
            isDisabled: !isDesktopShell,
            onSelect: () => {
                onOpenWorkspaceScreen();
                void confirmKillRobloxProcesses();
            },
        },
        {
            id: "command-sidebar",
            label: isSidebarOpen ? "Close sidebar" : "Open sidebar",
            description: "Toggle the main navigation rail.",
            icon: CommandIcon,
            meta: hotkeyLabels.toggleSidebar,
            keywords: "sidebar navigation toggle panel",
            onSelect: onToggleSidebar,
        },
        {
            id: "command-outline-panel",
            label: isOutlinePanelVisible
                ? "Hide outline panel"
                : "Show outline panel",
            description: activeTab
                ? "Toggle the editor outline panel for the current workspace tab."
                : "Open a workspace tab to use the outline panel.",
            icon: CommandIcon,
            meta: hotkeyLabels.toggleOutlinePanel,
            keywords:
                "outline panel symbols functions locals globals toggle sidebar",
            isDisabled: !activeTab,
            onSelect: () => {
                onOpenWorkspaceScreen();
                onToggleOutlinePanel();
            },
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
            id: "command-change-theme",
            label: "Change theme",
            description: "Switch between light, dark, or system theme.",
            icon: CommandIcon,
            keywords: "theme appearance light dark system",
            closeOnSelect: false,
            onSelect: onActivateThemeMode,
        },
        {
            id: "command-sidebar-position",
            label:
                sidebarPosition === "left"
                    ? "Set sidebar position: Right"
                    : "Set sidebar position: Left",
            description: "Toggle the sidebar and outline panel position.",
            icon: CommandIcon,
            meta: hotkeyLabels.toggleSidebarPosition,
            keywords: "sidebar position move toggle left right outline panel",
            onSelect: () => {
                onSetSidebarPosition(
                    sidebarPosition === "left" ? "right" : "left",
                );
            },
        },
    ];

    if (workspace) {
        commandItems.push({
            id: "command-create-file",
            label: "Create new file",
            description: "Add a fresh script tab to the current workspace.",
            icon: CommandIcon,
            meta: hotkeyLabels.createWorkspaceFile,
            keywords: "new create file tab script",
            onSelect: () => {
                void createWorkspaceFile();
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
            description: executorState.hasSupportedExecutor
                ? `Run ${activeTab.fileName} through the executor.`
                : "No supported executor detected.",
            icon: CommandIcon,
            keywords: `execute run script ${activeTab.fileName}`,
            isDisabled: !executorState.hasSupportedExecutor,
            onSelect: () => {
                void executeActiveTab();
            },
        },
        {
            id: "command-goto-line",
            label: "Go to line",
            description: `Jump to a specific line in ${activeTab.fileName}.`,
            icon: CommandIcon,
            meta: hotkeyLabels.activateGoToLine,
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
                void saveActiveWorkspaceTab();
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
            id: "command-duplicate-tab",
            label: "Duplicate current tab",
            description: `Create a copy of ${activeTab.fileName}.`,
            icon: CommandIcon,
            keywords: `duplicate copy clone ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                void duplicateWorkspaceTab(activeTab.id);
            },
        },
        {
            id: "command-archive-tab",
            label: "Archive current tab",
            description: `Archive ${activeTab.fileName} from the tab bar.`,
            icon: CommandIcon,
            meta: hotkeyLabels.archiveWorkspaceTab,
            keywords: `archive close remove ${activeTab.fileName}`,
            onSelect: () => {
                void archiveWorkspaceTab(activeTab.id);
            },
        },
        {
            id: "command-delete-tab",
            label: "Delete current tab",
            description: `Permanently remove ${activeTab.fileName} from the workspace.`,
            icon: CommandIcon,
            keywords: `delete remove file ${activeTab.fileName}`,
            onSelect: () => {
                void deleteWorkspaceTab(activeTab.id);
            },
        },
    );

    commandItems.push(
        {
            id: "command-toggle-split-view",
            label: splitView ? "Toggle split view off" : "Toggle split view",
            description: splitView
                ? "Collapse the current split and return to a single editor pane."
                : `Open ${activeTab.fileName} in a two-pane split view.`,
            icon: CommandIcon,
            meta: hotkeyLabels.toggleWorkspaceSplitView,
            keywords: `split toggle pane editor ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                toggleWorkspaceSplitView();
            },
        },
        {
            id: "command-split-open-left",
            label: "Move current tab to left pane",
            description: `Place ${activeTab.fileName} in the left editor pane.`,
            icon: CommandIcon,
            meta: hotkeyLabels.moveWorkspaceTabToLeftPane,
            keywords: `split left pane editor view ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                openWorkspaceTabInPane(activeTab.id, "primary");
            },
        },
        {
            id: "command-split-open-right",
            label: "Move current tab to right pane",
            description: `Place ${activeTab.fileName} in the right editor pane.`,
            icon: CommandIcon,
            meta: hotkeyLabels.moveWorkspaceTabToRightPane,
            keywords: `split right pane editor view ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                openWorkspaceTabInPane(activeTab.id, "secondary");
            },
        },
    );

    if (splitView) {
        commandItems.push(
            {
                id: "command-split-focus-left",
                label: "Focus left pane",
                description: "Move focus to the left editor pane.",
                icon: CommandIcon,
                keywords: "split left pane focus editor",
                isDisabled: splitView.focusedPane === "primary",
                meta:
                    splitView.focusedPane === "primary"
                        ? "Current"
                        : hotkeyLabels.focusWorkspaceLeftPane,
                onSelect: () => {
                    onOpenWorkspaceScreen();
                    focusWorkspacePane("primary");
                },
            },
            {
                id: "command-split-focus-right",
                label: "Focus right pane",
                description: "Move focus to the right editor pane.",
                icon: CommandIcon,
                keywords: "split right pane focus editor",
                isDisabled: splitView.focusedPane === "secondary",
                meta:
                    splitView.focusedPane === "secondary"
                        ? "Current"
                        : hotkeyLabels.focusWorkspaceRightPane,
                onSelect: () => {
                    onOpenWorkspaceScreen();
                    focusWorkspacePane("secondary");
                },
            },
            {
                id: "command-split-reset",
                label: "Reset split view",
                description:
                    "Reset the split ratio back to an even 50/50 layout.",
                icon: CommandIcon,
                meta: hotkeyLabels.resetWorkspaceSplitView,
                keywords: "split reset ratio even equal panes editor",
                onSelect: () => {
                    onOpenWorkspaceScreen();
                    resetWorkspaceSplitView();
                },
            },
        );
    }

    return commandItems;
}

async function confirmKillRobloxProcesses(): Promise<void> {
    const shouldKillRoblox = await confirmAction("Attempt to close Roblox?");

    if (!shouldKillRoblox) {
        return;
    }

    await killRobloxProcesses();
}

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

export function getThemeCommandPaletteItems({
    currentTheme,
    onSetTheme,
}: GetThemeCommandPaletteItemsOptions): AppCommandPaletteItem[] {
    const themeOptions: Array<{
        id: string;
        label: string;
        value: "light" | "dark" | "system";
        description: string;
        keywords: string;
    }> = [
        {
            id: "command-theme-light",
            label: "Light",
            value: "light",
            description: "Use the light color scheme.",
            keywords: "theme light",
        },
        {
            id: "command-theme-dark",
            label: "Dark",
            value: "dark",
            description: "Use the dark color scheme.",
            keywords: "theme dark",
        },
        {
            id: "command-theme-system",
            label: "System",
            value: "system",
            description: "Follow the system appearance.",
            keywords: "theme system auto",
        },
    ];

    return themeOptions.map((option) => ({
        id: option.id,
        label: option.label,
        description: option.description,
        icon: CommandIcon,
        meta: currentTheme === option.value ? "Current" : undefined,
        keywords: option.keywords,
        isDisabled: currentTheme === option.value,
        onSelect: () => {
            onSetTheme(option.value);
        },
    }));
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
