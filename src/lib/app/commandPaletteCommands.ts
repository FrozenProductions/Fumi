import { CommandIcon } from "@hugeicons/core-free-icons";
import type { AppCommandPaletteItem } from "../../lib/app/app.type";
import { launchRoblox } from "../../lib/platform/accounts";
import { isTauriEnvironment } from "../../lib/platform/runtime";
import type { GetCommandPaletteCommandItemsOptions } from "./commandPalette.type";
import {
    confirmKillRobloxProcesses,
    getCurrentStateMeta,
} from "./commandPaletteShared";

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
    onOpenAutomaticExecution,
    onOpenScriptLibrary,
    onOpenAccounts,
    onOpenExecutionHistory,
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
            id: "command-open-automatic-execution",
            label: "Open Automatic Execution",
            description: "Manage the executor autoexec folder.",
            icon: CommandIcon,
            meta: getCurrentStateMeta(
                activeSidebarItem === "automatic-execution",
                hotkeyLabels.openAutomaticExecution,
            ),
            keywords: "automatic execution autoexec startup executor scripts",
            isDisabled: activeSidebarItem === "automatic-execution",
            onSelect: onOpenAutomaticExecution,
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
        commandItems.push(
            {
                id: "command-open-execution-history",
                label: "Open execution history",
                description:
                    "Inspect successful manual executes for this workspace.",
                icon: CommandIcon,
                keywords:
                    "execution history execute run replay script workspace",
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
        );
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
