import type {
    AppCommandPaletteMode,
    AppCommandPaletteScope,
    AppEditorSettings,
    AppIntellisensePriority,
    AppIntellisenseWidth,
    AppSidebarItem,
    AppTheme,
    AppUpdaterSettings,
} from "../../lib/app/app.type";

export type AppStoreState = {
    isSidebarOpen: boolean;
    isCommandPaletteOpen: boolean;
    commandPaletteScope: AppCommandPaletteScope | null;
    commandPaletteMode: AppCommandPaletteMode | null;
    activeSidebarItem: AppSidebarItem;
    goToLineRequest: {
        lineNumber: number;
        requestId: number;
    } | null;
    nextGoToLineRequestId: number;
    zoomPercent: number;
    theme: AppTheme;
    editorSettings: AppEditorSettings;
    updaterSettings: AppUpdaterSettings;
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
    selectSidebarItem: (item: AppSidebarItem) => void;
    setZoomPercent: (zoomPercent: number) => void;
    setTheme: (theme: AppTheme) => void;
    setAutoUpdateEnabled: (isEnabled: boolean) => void;
    setEditorFontSize: (fontSize: number) => void;
    setEditorIntellisenseEnabled: (isEnabled: boolean) => void;
    setEditorIntellisensePriority: (priority: AppIntellisensePriority) => void;
    setEditorIntellisenseWidth: (width: AppIntellisenseWidth) => void;
};

export type AppStore = AppStoreState & AppStoreActions;
