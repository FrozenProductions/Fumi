import { useHotkey } from "@tanstack/react-hotkeys";
import type { UseAppScopedHotkeysOptions } from "./useAppHotkeys.type";

export function useAppScopedHotkeys({
    activeSidebarItem,
    isCommandPaletteOpen,
    activeTab,
    workspace,
    hotkeys,
    closeCommandPalette,
    selectSidebarItem,
    toggleCommandPalette,
    toggleCommandPaletteScope,
    toggleGoToLineCommandPalette,
    toggleSidebar,
    createWorkspaceFile,
    openWorkspaceDirectory,
    archiveWorkspaceTab,
    openWorkspaceTabInPane,
    resetWorkspaceSplitView,
    toggleWorkspaceSplitView,
    focusWorkspacePane,
}: UseAppScopedHotkeysOptions): void {
    const isWorkspaceScreenActive = activeSidebarItem === "workspace";
    const hasSplitView = Boolean(workspace?.splitView);
    const hasActiveTab = Boolean(activeTab);
    const canRunWorkspaceTabAction =
        !isCommandPaletteOpen && isWorkspaceScreenActive && Boolean(workspace);
    const canUseSplitViewHotkeys =
        !isCommandPaletteOpen &&
        activeSidebarItem !== "settings" &&
        hasSplitView;
    const canToggleSplitView =
        !isCommandPaletteOpen && Boolean(workspace) && hasActiveTab;

    useHotkey(
        hotkeys.openWorkspaceDirectory,
        () => {
            void openWorkspaceDirectory();
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        hotkeys.toggleSidebar,
        () => {
            toggleSidebar();
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        hotkeys.openWorkspaceScreen,
        () => {
            selectSidebarItem("workspace");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        hotkeys.openAutomaticExecution,
        () => {
            selectSidebarItem("automatic-execution");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        hotkeys.openScriptLibrary,
        () => {
            selectSidebarItem("script-library");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        hotkeys.openAccounts,
        () => {
            selectSidebarItem("accounts");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(hotkeys.openCommandPalette, () => {
        toggleCommandPalette();
    });

    useHotkey(
        hotkeys.openSettings,
        () => {
            if (activeSidebarItem === "settings") {
                selectSidebarItem("workspace");
                return;
            }

            selectSidebarItem("settings");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        hotkeys.commandPaletteCommands,
        () => {
            toggleCommandPaletteScope("commands");
        },
        {
            enabled: isCommandPaletteOpen,
        },
    );

    useHotkey(
        hotkeys.commandPaletteWorkspaces,
        () => {
            toggleCommandPaletteScope("workspaces");
        },
        {
            enabled: isCommandPaletteOpen,
        },
    );

    useHotkey(hotkeys.goToLine, () => {
        toggleGoToLineCommandPalette();
    });

    useHotkey(
        "Escape",
        () => {
            if (isCommandPaletteOpen) {
                closeCommandPalette();
                return;
            }

            if (activeSidebarItem === "settings") {
                selectSidebarItem("workspace");
            }
        },
        {
            enabled: isCommandPaletteOpen || activeSidebarItem === "settings",
        },
    );

    useHotkey(
        hotkeys.createWorkspaceFile,
        () => {
            void createWorkspaceFile();
        },
        {
            enabled: canRunWorkspaceTabAction,
        },
    );

    useHotkey(
        hotkeys.archiveWorkspaceTab,
        () => {
            const activeTabId = activeTab?.id;

            if (!activeTabId) {
                return;
            }

            void archiveWorkspaceTab(activeTabId);
        },
        {
            enabled: canRunWorkspaceTabAction && hasActiveTab,
        },
    );

    useHotkey(
        hotkeys.toggleWorkspaceSplitView,
        () => {
            selectSidebarItem("workspace");
            toggleWorkspaceSplitView();
        },
        {
            enabled: canToggleSplitView,
        },
    );

    useHotkey(
        hotkeys.moveWorkspaceTabToLeftPane,
        () => {
            const activeTabId = activeTab?.id;

            if (!activeTabId) {
                return;
            }

            selectSidebarItem("workspace");
            openWorkspaceTabInPane(activeTabId, "primary");
        },
        {
            enabled: canToggleSplitView,
        },
    );

    useHotkey(
        hotkeys.moveWorkspaceTabToRightPane,
        () => {
            const activeTabId = activeTab?.id;

            if (!activeTabId) {
                return;
            }

            selectSidebarItem("workspace");
            openWorkspaceTabInPane(activeTabId, "secondary");
        },
        {
            enabled: canToggleSplitView,
        },
    );

    useHotkey(
        hotkeys.resetWorkspaceSplitView,
        () => {
            selectSidebarItem("workspace");
            resetWorkspaceSplitView();
        },
        {
            enabled: canUseSplitViewHotkeys,
        },
    );

    useHotkey(
        hotkeys.focusWorkspaceLeftPane,
        () => {
            selectSidebarItem("workspace");
            focusWorkspacePane("primary");
        },
        {
            enabled: canUseSplitViewHotkeys,
        },
    );

    useHotkey(
        hotkeys.focusWorkspaceRightPane,
        () => {
            selectSidebarItem("workspace");
            focusWorkspacePane("secondary");
        },
        {
            enabled: canUseSplitViewHotkeys,
        },
    );
}
