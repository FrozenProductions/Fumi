import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteScope,
    AppCommandPaletteViewMode,
    AppSidebarItem,
    AppTheme,
    AppCommandPaletteMode as RequestedAppCommandPaletteMode,
} from "../../lib/app/app.type";
import type { UseWorkspaceExecutorResult } from "../workspace/useWorkspaceExecutor.type";
import type { UseWorkspaceSessionResult } from "../workspace/useWorkspaceSession.type";

export type UseAppCommandPaletteOptions = {
    isOpen: boolean;
    requestedScope: AppCommandPaletteScope | null;
    requestedMode: RequestedAppCommandPaletteMode | null;
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

export type UseAppCommandPaletteResult = {
    panelRef: RefObject<HTMLDivElement | null>;
    inputRef: RefObject<HTMLInputElement | null>;
    isPresent: boolean;
    isClosing: boolean;
    mode: AppCommandPaletteViewMode;
    query: string;
    scope: AppCommandPaletteScope;
    activeResultIndex: number;
    results: AppCommandPaletteItem[];
    commitSelection: (item: AppCommandPaletteItem) => void;
    handleBackdropMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
    handleHoverItem: (index: number) => void;
    handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    handleScopeSelect: (
        nextScope: Exclude<AppCommandPaletteScope, "tabs">,
    ) => void;
};
