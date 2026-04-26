import type { KeyboardEvent, MouseEvent, RefObject } from "react";
import type { UseWorkspaceExecutorResult } from "../../workspace/executor/executor.type";
import type { UseWorkspaceSessionResult } from "../../workspace/session.type";
import type { WorkspaceTab } from "../../workspace/workspace.type";
import type { AppTheme } from "../app.type";
import type { AppHotkeyBindings } from "../hotkeys/hotkeys.type";
import type { AppSidebarItem, AppSidebarPosition } from "../sidebar.type";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteMode,
    AppCommandPaletteScope,
    AppCommandPaletteViewMode,
} from "./commandPaletteDomain.type";

export type GetCommandPaletteCommandItemsOptions = {
    workspaceSession: UseWorkspaceSessionResult;
    workspaceExecutor: UseWorkspaceExecutorResult;
    isSidebarOpen: boolean;
    activeSidebarItem: AppSidebarItem;
    sidebarPosition: AppSidebarPosition;
    hotkeyLabels: AppCommandPaletteHotkeyLabels;
    onActivateGoToLineMode: () => void;
    onActivateAttachMode: () => void;
    onActivateThemeMode: () => void;
    onOpenWorkspaceScreen: () => void;
    onOpenAutomaticExecution: () => void;
    onOpenScriptLibrary: () => void;
    onOpenAccounts: () => void;
    onOpenExecutionHistory: () => void;
    onOpenSettings: () => void;
    isOutlinePanelVisible: boolean;
    onToggleSidebar: () => void;
    onToggleOutlinePanel: () => void;
    onSetSidebarPosition: (position: AppSidebarPosition) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onRequestRenameCurrentTab: () => void;
};

export type AppCommandPaletteControllerOptions = {
    isOpen: boolean;
    requestedScope: AppCommandPaletteScope | null;
    requestedMode: AppCommandPaletteMode | null;
    workspaceSession: UseWorkspaceSessionResult;
    workspaceExecutor: UseWorkspaceExecutorResult;
    isSidebarOpen: boolean;
    activeSidebarItem: AppSidebarItem;
    theme: AppTheme;
    sidebarPosition: AppSidebarPosition;
    onClose: () => void;
    onGoToLine: (lineNumber: number) => void;
    onOpenWorkspaceScreen: () => void;
    onOpenAutomaticExecution: () => void;
    onOpenScriptLibrary: () => void;
    onOpenAccounts: () => void;
    onOpenExecutionHistory: () => void;
    onToggleSidebar: () => void;
    onToggleOutlinePanel: () => void;
    onOpenSettings: () => void;
    isOutlinePanelVisible: boolean;
    onSetTheme: (theme: AppTheme) => void;
    onSetSidebarPosition: (position: AppSidebarPosition) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onRequestRenameCurrentTab: () => void;
};

export type AppCommandPaletteVisibilityState = {
    isPresent: boolean;
    isClosing: boolean;
};

export type AppCommandPaletteInputState = {
    panelRef: RefObject<HTMLDivElement | null>;
    inputRef: RefObject<HTMLInputElement | null>;
    mode: AppCommandPaletteViewMode;
    query: string;
    scope: AppCommandPaletteScope;
};

export type AppCommandPaletteResultsState = {
    activeResultIndex: number;
    results: AppCommandPaletteItem[];
};

export type AppCommandPaletteHandlers = {
    commitSelection: (item: AppCommandPaletteItem) => void;
    handleBackdropMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
    handleHoverItem: (index: number) => void;
    handleInputChange: (query: string) => void;
    handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    handleScopeSelect: (
        nextScope: Exclude<AppCommandPaletteScope, "tabs">,
    ) => void;
};

export type AppCommandPaletteControllerResult = {
    visibility: AppCommandPaletteVisibilityState;
    input: AppCommandPaletteInputState;
    results: AppCommandPaletteResultsState;
    handlers: AppCommandPaletteHandlers;
};

export type AppCommandPaletteHotkeyLabels = {
    activateGoToLine: string;
    archiveWorkspaceTab: string;
    toggleExecutorConnection: string;
    createWorkspaceFile: string;
    focusWorkspaceLeftPane: string;
    focusWorkspaceRightPane: string;
    killRoblox: string;
    launchRoblox: string;
    moveWorkspaceTabToLeftPane: string;
    moveWorkspaceTabToRightPane: string;
    openAccounts: string;
    openSettings: string;
    openWorkspaceDirectory: string;
    openWorkspaceScreen: string;
    openAutomaticExecution: string;
    openScriptLibrary: string;
    resetWorkspaceSplitView: string;
    toggleSidebar: string;
    toggleOutlinePanel: string;
    toggleWorkspaceSplitView: string;
    toggleSidebarPosition: string;
};

export type GetAppCommandPaletteResultsOptions = Pick<
    AppCommandPaletteControllerOptions,
    | "workspaceSession"
    | "workspaceExecutor"
    | "isSidebarOpen"
    | "activeSidebarItem"
    | "theme"
    | "sidebarPosition"
    | "onGoToLine"
    | "onOpenWorkspaceScreen"
    | "onOpenAutomaticExecution"
    | "onOpenScriptLibrary"
    | "onOpenAccounts"
    | "onOpenExecutionHistory"
    | "onToggleSidebar"
    | "onToggleOutlinePanel"
    | "onOpenSettings"
    | "isOutlinePanelVisible"
    | "onSetTheme"
    | "onSetSidebarPosition"
    | "onZoomIn"
    | "onZoomOut"
    | "onZoomReset"
    | "onRequestRenameCurrentTab"
> & {
    hotkeyBindings: AppHotkeyBindings;
    activeTab: WorkspaceTab | null;
    goToLineNumber: number | null;
    mode: AppCommandPaletteViewMode;
    scope: AppCommandPaletteScope;
    normalizedQuery: string;
    onActivateGoToLineMode: () => void;
    onActivateAttachMode: () => void;
    onActivateThemeMode: () => void;
};

export type GetGoToLineCommandPaletteItemsOptions = {
    activeTab: WorkspaceTab | null;
    goToLineNumber: number | null;
    onGoToLine: (lineNumber: number) => void;
};

export type GetAttachCommandPaletteItemsOptions = {
    workspaceExecutor: UseWorkspaceExecutorResult;
    onOpenWorkspaceScreen: () => void;
};

export type GetThemeCommandPaletteItemsOptions = {
    currentTheme: AppTheme;
    onSetTheme: (theme: AppTheme) => void;
};

export type WorkspaceCommandPaletteItem = AppCommandPaletteItem;

export type AppCommandPaletteSearchFieldName =
    | "label"
    | "keywords"
    | "meta"
    | "description";

export type AppCommandPaletteSearchResult = {
    item: AppCommandPaletteItem;
    index: number;
    score: number;
};
