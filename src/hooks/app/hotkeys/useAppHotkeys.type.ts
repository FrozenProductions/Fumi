import type {
    AppHotkeyBinding,
    AppHotkeyBindings,
    AppSidebarItem,
} from "../../../lib/app/app.type";
import type {
    WorkspaceSessionState,
    WorkspaceSessionTabActions,
    WorkspaceSessionWorkspaceActions,
} from "../../workspace/useWorkspaceSession.type";

export type ResolvedAppHotkeyBindings = {
    hotkeyBindings: AppHotkeyBindings;
    openCommandPalette: AppHotkeyBinding;
    openSettings: AppHotkeyBinding;
    commandPaletteCommands: AppHotkeyBinding;
    commandPaletteWorkspaces: AppHotkeyBinding;
    goToLine: AppHotkeyBinding;
    openWorkspaceDirectory: AppHotkeyBinding;
    toggleSidebar: AppHotkeyBinding;
    openWorkspaceScreen: AppHotkeyBinding;
    openAutomaticExecution: AppHotkeyBinding;
    openScriptLibrary: AppHotkeyBinding;
    openAccounts: AppHotkeyBinding;
    createWorkspaceFile: AppHotkeyBinding;
    archiveWorkspaceTab: AppHotkeyBinding;
    toggleWorkspaceSplitView: AppHotkeyBinding;
    moveWorkspaceTabToLeftPane: AppHotkeyBinding;
    moveWorkspaceTabToRightPane: AppHotkeyBinding;
    resetWorkspaceSplitView: AppHotkeyBinding;
    focusWorkspaceLeftPane: AppHotkeyBinding;
    focusWorkspaceRightPane: AppHotkeyBinding;
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
    openWorkspaceTabInPane: WorkspaceSessionTabActions["openWorkspaceTabInPane"];
    resetWorkspaceSplitView: WorkspaceSessionTabActions["resetWorkspaceSplitView"];
    toggleWorkspaceSplitView: WorkspaceSessionTabActions["toggleWorkspaceSplitView"];
    focusWorkspacePane: WorkspaceSessionTabActions["focusWorkspacePane"];
};
