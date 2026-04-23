import { CommandIcon } from "@hugeicons/core-free-icons";
import { launchRoblox } from "../../../platform/accounts";
import { isTauriEnvironment } from "../../../platform/runtime";
import type { AppCommandPaletteItem } from "../../app.type";
import type { GetCommandPaletteCommandItemsOptions } from "../commandPalette.type";
import {
    confirmKillRobloxProcesses,
    getCurrentStateMeta,
} from "../commandPaletteShared";

type CommandPaletteBaseOptions = Pick<
    GetCommandPaletteCommandItemsOptions,
    | "activeSidebarItem"
    | "hotkeyLabels"
    | "isOutlinePanelVisible"
    | "isSidebarOpen"
    | "onActivateThemeMode"
    | "onOpenAccounts"
    | "onOpenAutomaticExecution"
    | "onOpenScriptLibrary"
    | "onOpenSettings"
    | "onOpenWorkspaceScreen"
    | "onSetSidebarPosition"
    | "onToggleOutlinePanel"
    | "onToggleSidebar"
    | "onZoomIn"
    | "onZoomOut"
    | "onZoomReset"
    | "sidebarPosition"
    | "workspaceSession"
>;

export function getBaseCommandPaletteItems({
    activeSidebarItem,
    hotkeyLabels,
    isOutlinePanelVisible,
    isSidebarOpen,
    onActivateThemeMode,
    onOpenAccounts,
    onOpenAutomaticExecution,
    onOpenScriptLibrary,
    onOpenSettings,
    onOpenWorkspaceScreen,
    onSetSidebarPosition,
    onToggleOutlinePanel,
    onToggleSidebar,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    sidebarPosition,
    workspaceSession,
}: CommandPaletteBaseOptions): AppCommandPaletteItem[] {
    const { activeTab, workspace } = workspaceSession.state;
    const { openWorkspaceDirectory } = workspaceSession.workspaceActions;
    const isDesktopShell = isTauriEnvironment();

    return [
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
}
