import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteScope,
    AppCommandPaletteViewMode,
    AppCommandPaletteMode as RequestedAppCommandPaletteMode,
} from "../../lib/app/app.type";
import type { UseWorkspaceSessionResult } from "../workspace/useWorkspaceSession.type";

export type UseAppCommandPaletteOptions = {
    isOpen: boolean;
    requestedScope: AppCommandPaletteScope | null;
    requestedMode: RequestedAppCommandPaletteMode | null;
    workspaceSession: UseWorkspaceSessionResult;
    isSidebarOpen: boolean;
    onClose: () => void;
    onGoToLine: (lineNumber: number) => void;
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
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
