import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
    APP_ZOOM_DEFAULT,
    APP_ZOOM_MAX,
    APP_ZOOM_MIN,
    DEFAULT_APP_EDITOR_SETTINGS,
    DEFAULT_APP_THEME,
} from "../../constants/app/settings";
import type {
    AppCommandPaletteMode,
    AppCommandPaletteScope,
} from "../../types/app/commandPalette";
import type {
    AppEditorSettings,
    AppIntellisensePriority,
    AppTheme,
} from "../../types/app/settings";
import type { AppSidebarItem } from "../../types/app/sidebar";

type AppStoreState = {
    isSidebarOpen: boolean;
    isSettingsOpen: boolean;
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
};

type AppStoreActions = {
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
    openSettings: () => void;
    closeSettings: () => void;
    toggleSettings: () => void;
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
    setEditorFontSize: (fontSize: number) => void;
    setEditorIntellisenseEnabled: (isEnabled: boolean) => void;
    setEditorIntellisensePriority: (priority: AppIntellisensePriority) => void;
};

type AppStore = AppStoreState & AppStoreActions;

function clampZoomPercent(zoomPercent: number): number {
    if (!Number.isFinite(zoomPercent)) {
        return APP_ZOOM_DEFAULT;
    }

    return Math.min(APP_ZOOM_MAX, Math.max(APP_ZOOM_MIN, zoomPercent));
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            isSettingsOpen: false,
            isCommandPaletteOpen: false,
            commandPaletteScope: null,
            commandPaletteMode: null,
            activeSidebarItem: "workspace",
            goToLineRequest: null,
            nextGoToLineRequestId: 0,
            zoomPercent: APP_ZOOM_DEFAULT,
            theme: DEFAULT_APP_THEME,
            editorSettings: DEFAULT_APP_EDITOR_SETTINGS,
            openSidebar: () => {
                set({ isSidebarOpen: true });
            },
            closeSidebar: () => {
                set({ isSidebarOpen: false });
            },
            toggleSidebar: () => {
                set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
            },
            openSettings: () => {
                set({ isSettingsOpen: true });
            },
            closeSettings: () => {
                set({ isSettingsOpen: false });
            },
            toggleSettings: () => {
                set((state) => ({ isSettingsOpen: !state.isSettingsOpen }));
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
        }),
        {
            name: "fumi-app-store",
            storage: createJSONStorage(() => localStorage),
            merge: (persistedState, currentState) => {
                const persistedAppState =
                    (persistedState as Partial<AppStoreState>) ?? {};

                return {
                    ...currentState,
                    ...persistedAppState,
                    editorSettings: {
                        ...currentState.editorSettings,
                        ...persistedAppState.editorSettings,
                    },
                };
            },
            partialize: (state) => ({
                isSidebarOpen: state.isSidebarOpen,
                activeSidebarItem: state.activeSidebarItem,
                zoomPercent: state.zoomPercent,
                theme: state.theme,
                editorSettings: state.editorSettings,
            }),
        },
    ),
);
