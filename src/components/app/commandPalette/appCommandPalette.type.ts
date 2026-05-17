import type { KeyboardEvent, RefObject } from "react";
import type {
    AppEditorSettings,
    AppEditorTabSize,
    AppIconGlyph,
    AppIntellisensePriority,
    AppTheme,
} from "../../../lib/app/app.type";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteMode,
    AppCommandPaletteScope,
} from "../../../lib/app/commandPalette/commandPaletteDomain.type";
import type {
    AppSidebarItem,
    AppSidebarPosition,
} from "../../../lib/app/sidebar.type";
import type { UseWorkspaceExecutorResult } from "../../../lib/workspace/executor/executor.type";

export type AppCommandPaletteRequestProps = {
    isOpen: boolean;
    requestedScope: AppCommandPaletteScope | null;
    requestedMode: AppCommandPaletteMode | null;
};

export type AppCommandPaletteContextProps = {
    workspaceExecutor: UseWorkspaceExecutorResult;
    isSidebarOpen: boolean;
    activeSidebarItem: AppSidebarItem;
    theme: AppTheme;
    sidebarPosition: AppSidebarPosition;
    editorSettings: AppEditorSettings;
    isOutlinePanelVisible: boolean;
};

export type AppCommandPaletteActionProps = {
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

export type AppCommandPaletteProps = {
    request: AppCommandPaletteRequestProps;
    context: AppCommandPaletteContextProps;
    actions: AppCommandPaletteActionProps;
};

export type AppCommandPaletteScopeButtonProps = {
    ariaLabel: string;
    content: string;
    shortcut: string;
    icon: AppIconGlyph;
    isPressed: boolean;
    onClick: () => void;
};

export type AppCommandPaletteInputRowProps = {
    inputRef: RefObject<HTMLInputElement | null>;
    mode: "default" | AppCommandPaletteMode;
    query: string;
    scope: AppCommandPaletteScope;
    scopeLabels: Record<AppCommandPaletteScope, string>;
    scopePlaceholders: Record<AppCommandPaletteScope, string>;
    onInputChange: (query: string) => void;
    onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onScopeSelect: (scope: Exclude<AppCommandPaletteScope, "tabs">) => void;
};

export type AppCommandPaletteResultsProps = {
    activeResultIndex: number;
    isClosing: boolean;
    results: AppCommandPaletteItem[];
    onCommitSelection: (item: AppCommandPaletteItem) => void;
    onHoverItem: (index: number) => void;
};
