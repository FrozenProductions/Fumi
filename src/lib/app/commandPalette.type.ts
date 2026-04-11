import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/useWorkspaceExecutor.type";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteMode,
    AppCommandPaletteScope,
    AppCommandPaletteViewMode,
    AppHotkeyBindings,
    AppSidebarItem,
    AppTheme,
} from "../../lib/app/app.type";
import type { WorkspaceTab } from "../../lib/workspace/workspace.type";

export type GetCommandPaletteCommandItemsOptions = {
    workspaceSession: UseWorkspaceSessionResult;
    workspaceExecutor: UseWorkspaceExecutorResult;
    isSidebarOpen: boolean;
    activeSidebarItem: AppSidebarItem;
    theme: AppTheme;
    hotkeyLabels: AppCommandPaletteHotkeyLabels;
    onActivateGoToLineMode: () => void;
    onOpenWorkspaceScreen: () => void;
    onOpenScriptLibrary: () => void;
    onOpenAccounts: () => void;
    onOpenSettings: () => void;
    onToggleSidebar: () => void;
    onSetTheme: (theme: AppTheme) => void;
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
    onClose: () => void;
    onGoToLine: (lineNumber: number) => void;
    onOpenWorkspaceScreen: () => void;
    onOpenScriptLibrary: () => void;
    onOpenAccounts: () => void;
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
    onSetTheme: (theme: AppTheme) => void;
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
    handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
    openScriptLibrary: string;
    resetWorkspaceSplitView: string;
    toggleSidebar: string;
    toggleWorkspaceSplitView: string;
};

export type GetAppCommandPaletteResultsOptions = Pick<
    AppCommandPaletteControllerOptions,
    | "workspaceSession"
    | "workspaceExecutor"
    | "isSidebarOpen"
    | "activeSidebarItem"
    | "theme"
    | "onGoToLine"
    | "onOpenWorkspaceScreen"
    | "onOpenScriptLibrary"
    | "onOpenAccounts"
    | "onToggleSidebar"
    | "onOpenSettings"
    | "onSetTheme"
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
};

export type GetGoToLineCommandPaletteItemsOptions = {
    activeTab: WorkspaceTab | null;
    goToLineNumber: number | null;
    onGoToLine: (lineNumber: number) => void;
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
