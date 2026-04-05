import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
    APP_ZOOM_DEFAULT,
    APP_ZOOM_MAX,
    APP_ZOOM_MIN,
    DEFAULT_APP_EDITOR_SETTINGS,
    DEFAULT_APP_THEME,
    DEFAULT_APP_UPDATER_SETTINGS,
} from "../../constants/app/settings";
import { APP_SIDEBAR_ITEM_IDS } from "../../constants/app/sidebar";
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

const APP_THEMES = ["light", "dark"] as const;
const APP_INTELLISENSE_WIDTHS = ["small", "normal", "large"] as const;

type AppStoreState = {
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

type AppStoreActions = {
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

type AppStore = AppStoreState & AppStoreActions;

function clampZoomPercent(zoomPercent: number): number {
    if (!Number.isFinite(zoomPercent)) {
        return APP_ZOOM_DEFAULT;
    }

    return Math.min(APP_ZOOM_MAX, Math.max(APP_ZOOM_MIN, zoomPercent));
}

function isAppSidebarItem(value: unknown): value is AppSidebarItem {
    return (
        typeof value === "string" &&
        APP_SIDEBAR_ITEM_IDS.includes(value as AppSidebarItem)
    );
}

function isAppTheme(value: unknown): value is AppTheme {
    return typeof value === "string" && APP_THEMES.includes(value as AppTheme);
}

function normalizeAppIntellisenseWidth(value: unknown): AppIntellisenseWidth {
    if (value === "current") {
        return "large";
    }

    if (value === "smallest") {
        return "small";
    }

    if (value === "small") {
        return "normal";
    }

    if (value === "normal") {
        return "large";
    }

    return typeof value === "string" &&
        APP_INTELLISENSE_WIDTHS.includes(value as AppIntellisenseWidth)
        ? (value as AppIntellisenseWidth)
        : DEFAULT_APP_EDITOR_SETTINGS.intellisenseWidth;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            isCommandPaletteOpen: false,
            commandPaletteScope: null,
            commandPaletteMode: null,
            activeSidebarItem: "workspace",
            goToLineRequest: null,
            nextGoToLineRequestId: 0,
            zoomPercent: APP_ZOOM_DEFAULT,
            theme: DEFAULT_APP_THEME,
            editorSettings: DEFAULT_APP_EDITOR_SETTINGS,
            updaterSettings: DEFAULT_APP_UPDATER_SETTINGS,
            openSidebar: () => {
                set({ isSidebarOpen: true });
            },
            closeSidebar: () => {
                set({ isSidebarOpen: false });
            },
            toggleSidebar: () => {
                set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
            },
            openCommandPalette: (scope) => {
                set((state) => ({
                    isCommandPaletteOpen: true,
                    commandPaletteScope:
                        scope === undefined ? state.commandPaletteScope : scope,
                    commandPaletteMode: null,
                }));
            },
            closeCommandPalette: () => {
                set({ isCommandPaletteOpen: false });
            },
            toggleCommandPalette: () => {
                set((state) =>
                    state.isCommandPaletteOpen
                        ? {
                              isCommandPaletteOpen: false,
                          }
                        : {
                              isCommandPaletteOpen: true,
                              commandPaletteScope: state.commandPaletteScope,
                              commandPaletteMode: null,
                          },
                );
            },
            toggleCommandPaletteScope: (scope) => {
                set((state) => {
                    if (!state.isCommandPaletteOpen) {
                        return {
                            isCommandPaletteOpen: true,
                            commandPaletteScope: scope,
                            commandPaletteMode: null,
                        };
                    }

                    return {
                        commandPaletteScope:
                            state.commandPaletteScope === scope ? null : scope,
                        commandPaletteMode: null,
                    };
                });
            },
            toggleGoToLineCommandPalette: () => {
                set((state) => {
                    if (
                        state.isCommandPaletteOpen &&
                        state.commandPaletteMode === "goto-line"
                    ) {
                        return {
                            isCommandPaletteOpen: false,
                        };
                    }

                    return {
                        isCommandPaletteOpen: true,
                        commandPaletteScope: "commands",
                        commandPaletteMode: "goto-line",
                    };
                });
            },
            requestGoToLine: (lineNumber) => {
                if (!Number.isInteger(lineNumber) || lineNumber < 1) {
                    return;
                }

                set((state) => {
                    const nextGoToLineRequestId =
                        state.nextGoToLineRequestId + 1;

                    return {
                        goToLineRequest: {
                            lineNumber,
                            requestId: nextGoToLineRequestId,
                        },
                        nextGoToLineRequestId,
                    };
                });
            },
            clearGoToLineRequest: () => {
                set({ goToLineRequest: null });
            },
            selectSidebarItem: (item) => {
                set({ activeSidebarItem: item });
            },
            setZoomPercent: (zoomPercent) => {
                set({ zoomPercent: clampZoomPercent(zoomPercent) });
            },
            setTheme: (theme) => {
                set({ theme });
            },
            setAutoUpdateEnabled: (isEnabled) => {
                set((state) => ({
                    updaterSettings: {
                        ...state.updaterSettings,
                        isAutoUpdateEnabled: isEnabled,
                    },
                }));
            },
            setEditorFontSize: (fontSize) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        fontSize,
                    },
                }));
            },
            setEditorIntellisenseEnabled: (isEnabled) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        isIntellisenseEnabled: isEnabled,
                    },
                }));
            },
            setEditorIntellisensePriority: (priority) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        intellisensePriority: priority,
                    },
                }));
            },
            setEditorIntellisenseWidth: (width) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        intellisenseWidth: width,
                    },
                }));
            },
        }),
        {
            name: "fumi-app-store",
            storage: createJSONStorage(() => localStorage),
            merge: (persistedState, currentState) => {
                const persistedAppState =
                    (persistedState as Partial<AppStoreState>) ?? {};
                const zoomPercent = clampZoomPercent(
                    typeof persistedAppState.zoomPercent === "number"
                        ? persistedAppState.zoomPercent
                        : APP_ZOOM_DEFAULT,
                );
                const activeSidebarItem = isAppSidebarItem(
                    persistedAppState.activeSidebarItem,
                )
                    ? persistedAppState.activeSidebarItem
                    : currentState.activeSidebarItem;
                const theme = isAppTheme(persistedAppState.theme)
                    ? persistedAppState.theme
                    : currentState.theme;
                const intellisenseWidth = normalizeAppIntellisenseWidth(
                    persistedAppState.editorSettings?.intellisenseWidth,
                );

                return {
                    ...currentState,
                    ...persistedAppState,
                    activeSidebarItem,
                    zoomPercent,
                    theme,
                    updaterSettings: {
                        ...currentState.updaterSettings,
                        ...persistedAppState.updaterSettings,
                    },
                    editorSettings: {
                        ...currentState.editorSettings,
                        ...persistedAppState.editorSettings,
                        intellisenseWidth,
                    },
                };
            },
            partialize: (state) => ({
                isSidebarOpen: state.isSidebarOpen,
                activeSidebarItem: state.activeSidebarItem,
                zoomPercent: state.zoomPercent,
                theme: state.theme,
                updaterSettings: state.updaterSettings,
                editorSettings: state.editorSettings,
            }),
        },
    ),
);
