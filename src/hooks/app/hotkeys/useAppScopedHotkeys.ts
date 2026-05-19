import type { RegisterableHotkey } from "@tanstack/hotkeys";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { AppHotkeyBinding } from "../../../lib/app/hotkeys/hotkeys.type";
import type { UseAppScopedHotkeysOptions } from "./useAppHotkeys.type";

const DISABLED_HOTKEY_PLACEHOLDER: RegisterableHotkey = {
    key: "F13",
    mod: false,
    ctrl: false,
    alt: false,
    shift: false,
};

function toHotkeyOrPlaceholder(
    binding: AppHotkeyBinding | null,
): RegisterableHotkey {
    return binding ?? DISABLED_HOTKEY_PLACEHOLDER;
}

/** Registers app-scoped hotkeys for sidebar navigation, command palette, workspace actions, and executor controls. */
export function useAppScopedHotkeys({
    activeSidebarItem,
    isCommandPaletteOpen,
    activeTab,
    workspace,
    hotkeys,
    selectSidebarItem,
    toggleCommandPalette,
    toggleCommandPaletteScope,
    toggleGoToLineCommandPalette,
    toggleSidebar,
    createWorkspaceFile,
    openWorkspaceDirectory,
    archiveWorkspaceTab,
    splitWorkspaceTab,
    resetWorkspaceSplitView,
    toggleWorkspaceSplitView,
    focusWorkspacePane,
    hasSupportedExecutor,
    isExecutorAttached,
    isExecutorBusy,
    toggleExecutorConnection,
    executeActiveTab,
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
    const canToggleExecutorConnection =
        !isCommandPaletteOpen && hasSupportedExecutor && !isExecutorBusy;
    const canExecuteActiveTab =
        !isCommandPaletteOpen &&
        hasActiveTab &&
        hasSupportedExecutor &&
        isExecutorAttached &&
        !isExecutorBusy;

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.openWorkspaceDirectory),
        () => {
            void openWorkspaceDirectory();
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                hotkeys.openWorkspaceDirectory !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.toggleSidebar),
        () => {
            toggleSidebar();
        },
        {
            enabled: !isCommandPaletteOpen && hotkeys.toggleSidebar !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.openWorkspaceScreen),
        () => {
            selectSidebarItem("workspace");
        },
        {
            enabled:
                !isCommandPaletteOpen && hotkeys.openWorkspaceScreen !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.openAutomaticExecution),
        () => {
            selectSidebarItem("automatic-execution");
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                hotkeys.openAutomaticExecution !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.openScriptLibrary),
        () => {
            selectSidebarItem("script-library");
        },
        {
            enabled:
                !isCommandPaletteOpen && hotkeys.openScriptLibrary !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.openAccounts),
        () => {
            selectSidebarItem("accounts");
        },
        {
            enabled: !isCommandPaletteOpen && hotkeys.openAccounts !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.openCommandPalette),
        () => {
            toggleCommandPalette();
        },
        {
            enabled: hotkeys.openCommandPalette !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.openSettings),
        () => {
            if (activeSidebarItem === "settings") {
                selectSidebarItem("workspace");
                return;
            }

            selectSidebarItem("settings");
        },
        {
            enabled: !isCommandPaletteOpen && hotkeys.openSettings !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.commandPaletteCommands),
        () => {
            toggleCommandPaletteScope("commands");
        },
        {
            enabled:
                isCommandPaletteOpen && hotkeys.commandPaletteCommands !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.commandPaletteWorkspaces),
        () => {
            toggleCommandPaletteScope("workspaces");
        },
        {
            enabled:
                isCommandPaletteOpen &&
                hotkeys.commandPaletteWorkspaces !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.goToLine),
        () => {
            toggleGoToLineCommandPalette();
        },
        {
            enabled: hotkeys.goToLine !== null,
        },
    );

    useHotkey(
        "Escape",
        () => {
            if (activeSidebarItem === "settings") {
                selectSidebarItem("workspace");
            }
        },
        {
            enabled: !isCommandPaletteOpen && activeSidebarItem === "settings",
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.createWorkspaceFile),
        () => {
            void createWorkspaceFile();
        },
        {
            enabled:
                canRunWorkspaceTabAction &&
                hotkeys.createWorkspaceFile !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.archiveWorkspaceTab),
        () => {
            const activeTabId = activeTab?.id;

            if (!activeTabId) {
                return;
            }

            void archiveWorkspaceTab(activeTabId);
        },
        {
            enabled:
                canRunWorkspaceTabAction &&
                hasActiveTab &&
                hotkeys.archiveWorkspaceTab !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.toggleWorkspaceSplitView),
        () => {
            selectSidebarItem("workspace");
            toggleWorkspaceSplitView();
        },
        {
            enabled:
                canToggleSplitView && hotkeys.toggleWorkspaceSplitView !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.moveWorkspaceTabToLeftPane),
        () => {
            const activeTabId = activeTab?.id;

            if (!activeTabId) {
                return;
            }

            selectSidebarItem("workspace");
            splitWorkspaceTab(
                activeTabId,
                workspace?.splitView?.activePaneId ?? null,
                "left",
            );
        },
        {
            enabled:
                canToggleSplitView &&
                hotkeys.moveWorkspaceTabToLeftPane !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.moveWorkspaceTabToRightPane),
        () => {
            const activeTabId = activeTab?.id;

            if (!activeTabId) {
                return;
            }

            selectSidebarItem("workspace");
            splitWorkspaceTab(
                activeTabId,
                workspace?.splitView?.activePaneId ?? null,
                "right",
            );
        },
        {
            enabled:
                canToggleSplitView &&
                hotkeys.moveWorkspaceTabToRightPane !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.resetWorkspaceSplitView),
        () => {
            selectSidebarItem("workspace");
            resetWorkspaceSplitView();
        },
        {
            enabled:
                canUseSplitViewHotkeys &&
                hotkeys.resetWorkspaceSplitView !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.focusWorkspaceLeftPane),
        () => {
            selectSidebarItem("workspace");
            const activePaneId = workspace?.splitView?.activePaneId;

            if (activePaneId) {
                focusWorkspacePane(activePaneId);
            }
        },
        {
            enabled:
                canUseSplitViewHotkeys &&
                hotkeys.focusWorkspaceLeftPane !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.focusWorkspaceRightPane),
        () => {
            selectSidebarItem("workspace");
            const activePaneId = workspace?.splitView?.activePaneId;

            if (activePaneId) {
                focusWorkspacePane(activePaneId);
            }
        },
        {
            enabled:
                canUseSplitViewHotkeys &&
                hotkeys.focusWorkspaceRightPane !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.toggleExecutorConnection),
        () => {
            selectSidebarItem("workspace");
            void toggleExecutorConnection();
        },
        {
            enabled:
                canToggleExecutorConnection &&
                hotkeys.toggleExecutorConnection !== null,
        },
    );

    useHotkey(
        toHotkeyOrPlaceholder(hotkeys.executeActiveTab),
        () => {
            void executeActiveTab();
        },
        {
            enabled: canExecuteActiveTab && hotkeys.executeActiveTab !== null,
        },
    );
}
