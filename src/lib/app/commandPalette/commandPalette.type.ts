import type { KeyboardEvent, MouseEvent, RefObject } from "react";
import type { UseWorkspaceExecutorResult } from "../../workspace/executor/executor.type";
import type { UseWorkspaceSessionResult } from "../../workspace/session/session.type";
import type { WorkspaceTab } from "../../workspace/session/tabs/sessionTabs.type";
import type {
    AppEditorSettings,
    AppEditorTabSize,
    AppIntellisensePriority,
    AppTheme,
} from "../app.type";
import type { AppHotkeyBindings } from "../hotkeys/hotkeys.type";
import type { AppSidebarItem, AppSidebarPosition } from "../sidebar.type";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteMode,
    AppCommandPaletteScope,
    AppCommandPaletteViewMode,
    ParsedGoToLineResult,
} from "./commandPaletteDomain.type";

export type GetCommandPaletteCommandItemsOptions = {
    workspaceSession: UseWorkspaceSessionResult;
    workspaceExecutor: UseWorkspaceExecutorResult;
    isSidebarOpen: boolean;
    activeSidebarItem: AppSidebarItem;
    sidebarPosition: AppSidebarPosition;
    hotkeyLabels: AppCommandPaletteHotkeyLabels;
    onActivateArchivedTabMode: () => void;
    onActivateDeleteArchivedTabMode: () => void;
    onActivateGoToLineMode: () => void;
    onActivateAttachMode: () => void;
    onActivateIntellisensePriorityMode: () => void;
    onActivateSymbolMode: () => void;
    onActivateTabSizeMode: () => void;
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
    editorSettings: AppEditorSettings;
    onSetEditorIntellisenseEnabled: (isEnabled: boolean) => void;
    onSetEditorIntellisensePriority: (
        priority: AppIntellisensePriority,
    ) => void;
    onSetEditorRelativeLineNumbersEnabled: (isEnabled: boolean) => void;
    onSetEditorScopeHighlightingEnabled: (isEnabled: boolean) => void;
    onSetEditorSmoothCaretEnabled: (isEnabled: boolean) => void;
    onSetEditorTabSize: (tabSize: AppEditorTabSize) => void;
    onSetEditorWordWrapEnabled: (isEnabled: boolean) => void;
};

export type AppCommandPaletteControllerOptions = {
    isOpen: boolean;
    requestedScope: AppCommandPaletteScope | null;
    requestedMode: AppCommandPaletteMode | null;
    visibility: AppCommandPaletteVisibilityState;
    workspaceSession: UseWorkspaceSessionResult;
    workspaceExecutor: UseWorkspaceExecutorResult;
    isSidebarOpen: boolean;
    activeSidebarItem: AppSidebarItem;
    theme: AppTheme;
    sidebarPosition: AppSidebarPosition;
    editorSettings: AppEditorSettings;
    onClose: () => void;
    onGoToLine: (line: number, column?: number) => void;
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
    onSetEditorIntellisenseEnabled: (isEnabled: boolean) => void;
    onSetEditorIntellisensePriority: (
        priority: AppIntellisensePriority,
    ) => void;
    onSetEditorRelativeLineNumbersEnabled: (isEnabled: boolean) => void;
    onSetEditorScopeHighlightingEnabled: (isEnabled: boolean) => void;
    onSetEditorSmoothCaretEnabled: (isEnabled: boolean) => void;
    onSetEditorTabSize: (tabSize: AppEditorTabSize) => void;
    onSetEditorWordWrapEnabled: (isEnabled: boolean) => void;
};

export type AppCommandPaletteVisibilityState = {
    isPresent: boolean;
    isClosing: boolean;
};

type AppCommandPaletteInputState = {
    panelRef: RefObject<HTMLDivElement | null>;
    inputRef: RefObject<HTMLInputElement | null>;
    mode: AppCommandPaletteViewMode;
    query: string;
    scope: AppCommandPaletteScope;
};

type AppCommandPaletteResultsState = {
    activeResultIndex: number;
    results: AppCommandPaletteItem[];
};

type AppCommandPaletteHandlers = {
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
    executeActiveTab: string;
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
    | "editorSettings"
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
    | "onSetEditorIntellisenseEnabled"
    | "onSetEditorIntellisensePriority"
    | "onSetEditorRelativeLineNumbersEnabled"
    | "onSetEditorScopeHighlightingEnabled"
    | "onSetEditorSmoothCaretEnabled"
    | "onSetEditorTabSize"
    | "onSetEditorWordWrapEnabled"
> & {
    hotkeyBindings: AppHotkeyBindings;
    activeTab: WorkspaceTab | null;
    goToLineTarget: ParsedGoToLineResult | null;
    mode: AppCommandPaletteViewMode;
    scope: AppCommandPaletteScope;
    normalizedQuery: string;
    onActivateArchivedTabMode: () => void;
    onActivateDeleteArchivedTabMode: () => void;
    onActivateGoToLineMode: () => void;
    onActivateAttachMode: () => void;
    onActivateIntellisensePriorityMode: () => void;
    onActivateSymbolMode: () => void;
    onActivateTabSizeMode: () => void;
    onActivateThemeMode: () => void;
};

export type GetGoToLineCommandPaletteItemsOptions = {
    activeTab: WorkspaceTab | null;
    goToLineTarget: ParsedGoToLineResult | null;
    onGoToLine: (line: number, column?: number) => void;
};

export type GetAttachCommandPaletteItemsOptions = {
    workspaceExecutor: UseWorkspaceExecutorResult;
    onOpenWorkspaceScreen: () => void;
};

export type GetArchivedTabCommandPaletteItemsOptions = {
    workspaceSession: UseWorkspaceSessionResult;
    onOpenWorkspaceScreen: () => void;
};

export type GetDeleteArchivedTabCommandPaletteItemsOptions = {
    workspaceSession: UseWorkspaceSessionResult;
    onOpenWorkspaceScreen: () => void;
};

export type GetThemeCommandPaletteItemsOptions = {
    currentTheme: AppTheme;
    onSetTheme: (theme: AppTheme) => void;
};

export type GetIntellisensePriorityCommandPaletteItemsOptions = {
    currentPriority: AppIntellisensePriority;
    onSetPriority: (priority: AppIntellisensePriority) => void;
};

export type GetTabSizeCommandPaletteItemsOptions = {
    currentTabSize: AppEditorTabSize;
    onSetTabSize: (tabSize: AppEditorTabSize) => void;
};

export type GetSymbolCommandPaletteItemsOptions = {
    activeTab: WorkspaceTab | null;
    onGoToLine: (line: number, column?: number) => void;
    onOpenWorkspaceScreen: () => void;
};

export type AppCommandPaletteSearchFieldName =
    | "label"
    | "keywords"
    | "meta"
    | "description";
