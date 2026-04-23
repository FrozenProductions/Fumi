import type {
    AppAccountPrivacySettings,
    AppEditorSettings,
    AppIntellisensePriority,
    AppIntellisenseWidth,
    AppMiddleClickTabAction,
    AppTheme,
    AppUpdaterSettings,
    AppWorkspaceSettings,
} from "./app.type";
import type {
    AppCommandPaletteMode,
    AppCommandPaletteScope,
    AppGoToLineRequest,
    AppRenameCurrentTabRequest,
} from "./commandPalette/commandPaletteDomain.type";
import type {
    AppHotkeyAction,
    AppHotkeyBindings,
} from "./hotkeys/hotkeys.type";
import type { AppSidebarItem, AppSidebarPosition } from "./sidebar.type";

export type AppStoreState = AppAccountPrivacySettings & {
    isSidebarOpen: boolean;
    isCommandPaletteOpen: boolean;
    commandPaletteScope: AppCommandPaletteScope | null;
    commandPaletteMode: AppCommandPaletteMode | null;
    activeSidebarItem: AppSidebarItem;
    goToLineRequest: AppGoToLineRequest | null;
    nextGoToLineRequestId: number;
    renameCurrentTabRequest: AppRenameCurrentTabRequest | null;
    nextRenameCurrentTabRequestId: number;
    zoomPercent: number;
    theme: AppTheme;
    hotkeyBindings: AppHotkeyBindings;
    editorSettings: AppEditorSettings;
    updaterSettings: AppUpdaterSettings;
    workspaceSettings: AppWorkspaceSettings;
    sidebarPosition: AppSidebarPosition;
};

export type AppStoreActions = {
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
    openCommandPalette: (scope?: AppCommandPaletteScope | null) => void;
    closeCommandPalette: () => void;
    toggleCommandPalette: () => void;
    toggleCommandPaletteScope: (scope: AppCommandPaletteScope) => void;
    toggleGoToLineCommandPalette: () => void;
    requestGoToLine: (lineNumber: number) => void;
    clearGoToLineRequest: () => void;
    requestRenameCurrentTab: () => void;
    clearRenameCurrentTabRequest: () => void;
    selectSidebarItem: (item: AppSidebarItem) => void;
    setZoomPercent: (zoomPercent: number) => void;
    setTheme: (theme: AppTheme) => void;
    setHotkeyBinding: (
        action: AppHotkeyAction,
        binding: AppHotkeyBindings[AppHotkeyAction],
    ) => void;
    resetHotkeyBinding: (action: AppHotkeyAction) => void;
    resetAllHotkeyBindings: () => void;
    setAutoUpdateEnabled: (isEnabled: boolean) => void;
    setStreamerModeEnabled: (isEnabled: boolean) => void;
    setEditorFontSize: (fontSize: number) => void;
    setEditorWordWrapEnabled: (isEnabled: boolean) => void;
    setEditorIntellisenseEnabled: (isEnabled: boolean) => void;
    setEditorIntellisensePriority: (priority: AppIntellisensePriority) => void;
    setEditorIntellisenseWidth: (width: AppIntellisenseWidth) => void;
    setOutlinePanelWidth: (width: number) => void;
    setOutlineExpandedGroups: (patch: Record<string, boolean>) => void;
    setOutlineSearchQuery: (query: string) => void;
    setMiddleClickTabAction: (action: AppMiddleClickTabAction) => void;
    setSidebarPosition: (position: AppSidebarPosition) => void;
    toggleOutlinePanel: () => void;
};

export type AppStore = AppStoreState & AppStoreActions;
