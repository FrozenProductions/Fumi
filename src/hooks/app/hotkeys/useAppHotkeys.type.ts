import type {
    AppHotkeyAction,
    AppHotkeyBinding,
    AppHotkeyBindings,
} from "../../../lib/app/hotkeys/hotkeys.type";
import type { AppSidebarItem } from "../../../lib/app/sidebar.type";
import type { UseWorkspaceExecutorResult } from "../../../lib/workspace/executor/executor.type";
import type {
    WorkspaceSessionState,
    WorkspaceSessionTabActions,
    WorkspaceSessionWorkspaceActions,
} from "../../../lib/workspace/session/session.type";

export type ResolvedAppHotkeyBindings = {
    hotkeyBindings: AppHotkeyBindings;
    disabledHotkeys: AppHotkeyAction[];
    openCommandPalette: AppHotkeyBinding | null;
    openSettings: AppHotkeyBinding | null;
    commandPaletteCommands: AppHotkeyBinding | null;
    commandPaletteWorkspaces: AppHotkeyBinding | null;
    goToLine: AppHotkeyBinding | null;
    openWorkspaceDirectory: AppHotkeyBinding | null;
    toggleSidebar: AppHotkeyBinding | null;
    openWorkspaceScreen: AppHotkeyBinding | null;
    openAutomaticExecution: AppHotkeyBinding | null;
    openScriptLibrary: AppHotkeyBinding | null;
    openAccounts: AppHotkeyBinding | null;
    createWorkspaceFile: AppHotkeyBinding | null;
    archiveWorkspaceTab: AppHotkeyBinding | null;
    toggleWorkspaceSplitView: AppHotkeyBinding | null;
    moveWorkspaceTabToLeftPane: AppHotkeyBinding | null;
    moveWorkspaceTabToRightPane: AppHotkeyBinding | null;
    resetWorkspaceSplitView: AppHotkeyBinding | null;
    focusWorkspaceLeftPane: AppHotkeyBinding | null;
    focusWorkspaceRightPane: AppHotkeyBinding | null;
    toggleExecutorConnection: AppHotkeyBinding | null;
    executeActiveTab: AppHotkeyBinding | null;
};

export type UseAppGlobalHotkeyCaptureOptions = {
    activeSidebarItem: AppSidebarItem;
    isCommandPaletteOpen: boolean;
    activeTab: WorkspaceSessionState["activeTab"];
    workspace: WorkspaceSessionState["workspace"];
    hotkeys: ResolvedAppHotkeyBindings;
    selectSidebarItem: (item: AppSidebarItem) => void;
    toggleCommandPalette: () => void;
    toggleCommandPaletteScope: (scope: "commands" | "workspaces") => void;
    toggleGoToLineCommandPalette: () => void;
    toggleWorkspaceSplitView: WorkspaceSessionTabActions["toggleWorkspaceSplitView"];
    toggleExecutorConnection: UseWorkspaceExecutorResult["actions"]["toggleConnection"];
    executeActiveTab: UseWorkspaceExecutorResult["actions"]["executeActiveTab"];
    hasSupportedExecutor: boolean;
    isExecutorAttached: boolean;
    isExecutorBusy: boolean;
};

export type UseAppScopedHotkeysOptions = {
    activeSidebarItem: AppSidebarItem;
    isCommandPaletteOpen: boolean;
    activeTab: WorkspaceSessionState["activeTab"];
    workspace: WorkspaceSessionState["workspace"];
    hotkeys: ResolvedAppHotkeyBindings;
    closeCommandPalette: () => void;
    selectSidebarItem: (item: AppSidebarItem) => void;
    toggleCommandPalette: () => void;
    toggleCommandPaletteScope: (scope: "commands" | "workspaces") => void;
    toggleGoToLineCommandPalette: () => void;
    toggleSidebar: () => void;
    createWorkspaceFile: WorkspaceSessionWorkspaceActions["createWorkspaceFile"];
    openWorkspaceDirectory: WorkspaceSessionWorkspaceActions["openWorkspaceDirectory"];
    archiveWorkspaceTab: WorkspaceSessionTabActions["archiveWorkspaceTab"];
    splitWorkspaceTab: WorkspaceSessionTabActions["splitWorkspaceTab"];
    resetWorkspaceSplitView: WorkspaceSessionTabActions["resetWorkspaceSplitView"];
    toggleWorkspaceSplitView: WorkspaceSessionTabActions["toggleWorkspaceSplitView"];
    focusWorkspacePane: WorkspaceSessionTabActions["focusWorkspacePane"];
    hasSupportedExecutor: boolean;
    isExecutorAttached: boolean;
    isExecutorBusy: boolean;
    toggleExecutorConnection: UseWorkspaceExecutorResult["actions"]["toggleConnection"];
    executeActiveTab: UseWorkspaceExecutorResult["actions"]["executeActiveTab"];
};
