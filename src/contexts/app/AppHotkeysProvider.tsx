import { useHotkey } from "@tanstack/react-hotkeys";
import { type ReactElement, useEffect } from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import {
    getAppHotkeyBinding,
    shouldTriggerAppHotkeyCapture,
    shouldTriggerAppHotkeyCodeFallback,
} from "../../lib/app/hotkeys";
import type { AppHotkeysProviderProps } from "./appHotkeysProvider.type";

export function AppHotkeysProvider({
    children,
    workspaceSession,
}: AppHotkeysProviderProps): ReactElement {
    const { activeTab, workspace } = workspaceSession.state;
    const { createWorkspaceFile, openWorkspaceDirectory } =
        workspaceSession.workspaceActions;
    const {
        archiveWorkspaceTab,
        focusWorkspacePane,
        openWorkspaceTabInPane,
        resetWorkspaceSplitView,
        toggleWorkspaceSplitView,
    } = workspaceSession.tabActions;
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const activeSidebarItem = useAppStore((state) => state.activeSidebarItem);
    const isCommandPaletteOpen = useAppStore(
        (state) => state.isCommandPaletteOpen,
    );
    const closeCommandPalette = useAppStore(
        (state) => state.closeCommandPalette,
    );
    const toggleCommandPaletteScope = useAppStore(
        (state) => state.toggleCommandPaletteScope,
    );
    const toggleGoToLineCommandPalette = useAppStore(
        (state) => state.toggleGoToLineCommandPalette,
    );
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);
    const selectSidebarItem = useAppStore((state) => state.selectSidebarItem);
    const toggleCommandPalette = useAppStore(
        (state) => state.toggleCommandPalette,
    );
    const openCommandPaletteBinding = getAppHotkeyBinding(
        "OPEN_COMMAND_PALETTE",
        hotkeyBindings,
    );
    const openSettingsBinding = getAppHotkeyBinding(
        "OPEN_SETTINGS",
        hotkeyBindings,
    );
    const commandPaletteCommandsBinding = getAppHotkeyBinding(
        "TOGGLE_COMMAND_PALETTE_COMMANDS",
        hotkeyBindings,
    );
    const commandPaletteWorkspacesBinding = getAppHotkeyBinding(
        "TOGGLE_COMMAND_PALETTE_WORKSPACES",
        hotkeyBindings,
    );
    const goToLineBinding = getAppHotkeyBinding(
        "ACTIVATE_GOTO_LINE_COMMAND",
        hotkeyBindings,
    );
    const toggleWorkspaceSplitViewBinding = getAppHotkeyBinding(
        "TOGGLE_WORKSPACE_SPLIT_VIEW",
        hotkeyBindings,
    );
    const moveWorkspaceTabToLeftPaneBinding = getAppHotkeyBinding(
        "MOVE_WORKSPACE_TAB_TO_LEFT_PANE",
        hotkeyBindings,
    );
    const moveWorkspaceTabToRightPaneBinding = getAppHotkeyBinding(
        "MOVE_WORKSPACE_TAB_TO_RIGHT_PANE",
        hotkeyBindings,
    );
    const focusWorkspaceLeftPaneBinding = getAppHotkeyBinding(
        "FOCUS_WORKSPACE_LEFT_PANE",
        hotkeyBindings,
    );
    const focusWorkspaceRightPaneBinding = getAppHotkeyBinding(
        "FOCUS_WORKSPACE_RIGHT_PANE",
        hotkeyBindings,
    );
    const resetWorkspaceSplitViewBinding = getAppHotkeyBinding(
        "RESET_WORKSPACE_SPLIT_VIEW",
        hotkeyBindings,
    );

    useEffect(() => {
        const handleGlobalAppKeydown = (event: KeyboardEvent): void => {
            if (
                shouldTriggerAppHotkeyCapture(
                    event,
                    toggleWorkspaceSplitViewBinding,
                )
            ) {
                if (!isCommandPaletteOpen && workspace && activeTab) {
                    event.preventDefault();
                    event.stopPropagation();
                    selectSidebarItem("workspace");
                    toggleWorkspaceSplitView();
                }

                return;
            }

            if (
                shouldTriggerAppHotkeyCodeFallback(event, openSettingsBinding)
            ) {
                if (isCommandPaletteOpen) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                if (activeSidebarItem === "settings") {
                    selectSidebarItem("workspace");
                    return;
                }

                selectSidebarItem("settings");
                return;
            }

            if (
                shouldTriggerAppHotkeyCodeFallback(
                    event,
                    openCommandPaletteBinding,
                )
            ) {
                event.preventDefault();
                event.stopPropagation();
                toggleCommandPalette();
                return;
            }

            if (
                shouldTriggerAppHotkeyCodeFallback(
                    event,
                    commandPaletteCommandsBinding,
                )
            ) {
                if (!isCommandPaletteOpen) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                toggleCommandPaletteScope("commands");
                return;
            }

            if (
                shouldTriggerAppHotkeyCodeFallback(
                    event,
                    commandPaletteWorkspacesBinding,
                )
            ) {
                if (!isCommandPaletteOpen) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                toggleCommandPaletteScope("workspaces");
                return;
            }

            if (!shouldTriggerAppHotkeyCodeFallback(event, goToLineBinding)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            toggleGoToLineCommandPalette();
        };

        window.addEventListener("keydown", handleGlobalAppKeydown, true);

        return () => {
            window.removeEventListener("keydown", handleGlobalAppKeydown, true);
        };
    }, [
        activeSidebarItem,
        commandPaletteCommandsBinding,
        commandPaletteWorkspacesBinding,
        goToLineBinding,
        isCommandPaletteOpen,
        openCommandPaletteBinding,
        openSettingsBinding,
        selectSidebarItem,
        toggleWorkspaceSplitView,
        toggleWorkspaceSplitViewBinding,
        toggleCommandPalette,
        toggleCommandPaletteScope,
        toggleGoToLineCommandPalette,
        activeTab,
        workspace,
    ]);

    useHotkey(
        getAppHotkeyBinding("OPEN_WORKSPACE_DIRECTORY", hotkeyBindings),
        () => {
            void openWorkspaceDirectory();
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        getAppHotkeyBinding("TOGGLE_SIDEBAR", hotkeyBindings),
        () => {
            toggleSidebar();
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        getAppHotkeyBinding("OPEN_WORKSPACE_SCREEN", hotkeyBindings),
        () => {
            selectSidebarItem("workspace");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        getAppHotkeyBinding("OPEN_SCRIPT_LIBRARY", hotkeyBindings),
        () => {
            selectSidebarItem("script-library");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        getAppHotkeyBinding("OPEN_ACCOUNTS", hotkeyBindings),
        () => {
            selectSidebarItem("accounts");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(openCommandPaletteBinding, () => {
        toggleCommandPalette();
    });

    useHotkey(
        openSettingsBinding,
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
        commandPaletteCommandsBinding,
        () => {
            toggleCommandPaletteScope("commands");
        },
        {
            enabled: isCommandPaletteOpen,
        },
    );

    useHotkey(
        commandPaletteWorkspacesBinding,
        () => {
            toggleCommandPaletteScope("workspaces");
        },
        {
            enabled: isCommandPaletteOpen,
        },
    );

    useHotkey(goToLineBinding, () => {
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
        getAppHotkeyBinding("CREATE_WORKSPACE_FILE", hotkeyBindings),
        () => {
            void createWorkspaceFile();
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                activeSidebarItem === "workspace" &&
                Boolean(workspace),
        },
    );

    useHotkey(
        getAppHotkeyBinding("ARCHIVE_WORKSPACE_TAB", hotkeyBindings),
        () => {
            const activeTabId = activeTab?.id;

            if (!activeTabId) {
                return;
            }

            void archiveWorkspaceTab(activeTabId);
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                activeSidebarItem === "workspace" &&
                Boolean(workspace) &&
                Boolean(activeTab),
        },
    );

    useHotkey(
        toggleWorkspaceSplitViewBinding,
        () => {
            selectSidebarItem("workspace");
            toggleWorkspaceSplitView();
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                Boolean(workspace) &&
                Boolean(activeTab),
        },
    );

    useHotkey(
        moveWorkspaceTabToLeftPaneBinding,
        () => {
            const activeTabId = activeTab?.id;

            if (!activeTabId) {
                return;
            }

            selectSidebarItem("workspace");
            openWorkspaceTabInPane(activeTabId, "primary");
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                Boolean(workspace) &&
                Boolean(activeTab),
        },
    );

    useHotkey(
        moveWorkspaceTabToRightPaneBinding,
        () => {
            const activeTabId = activeTab?.id;

            if (!activeTabId) {
                return;
            }

            selectSidebarItem("workspace");
            openWorkspaceTabInPane(activeTabId, "secondary");
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                Boolean(workspace) &&
                Boolean(activeTab),
        },
    );

    useHotkey(
        resetWorkspaceSplitViewBinding,
        () => {
            selectSidebarItem("workspace");
            resetWorkspaceSplitView();
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                activeSidebarItem !== "settings" &&
                Boolean(workspace?.splitView),
        },
    );

    useHotkey(
        focusWorkspaceLeftPaneBinding,
        () => {
            selectSidebarItem("workspace");
            focusWorkspacePane("primary");
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                activeSidebarItem !== "settings" &&
                Boolean(workspace?.splitView),
        },
    );

    useHotkey(
        focusWorkspaceRightPaneBinding,
        () => {
            selectSidebarItem("workspace");
            focusWorkspacePane("secondary");
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                activeSidebarItem !== "settings" &&
                Boolean(workspace?.splitView),
        },
    );

    return <>{children}</>;
}
