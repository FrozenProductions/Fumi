import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
    APP_ZOOM_DEFAULT,
    DEFAULT_APP_EDITOR_SETTINGS,
    DEFAULT_APP_THEME,
    DEFAULT_APP_UPDATER_SETTINGS,
    DEFAULT_APP_WORKSPACE_SETTINGS,
} from "../../constants/app/settings";
import { normalizeAppHotkeyBindings } from "../../lib/app/hotkeys";
import {
    clampAppZoomPercent,
    isAppSidebarItem,
    isAppTheme,
    normalizeAppIntellisenseWidth,
    normalizeAppMiddleClickTabAction,
} from "../../lib/app/store";
import type { AppStore, AppStoreState } from "./appStore.type";

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
            renameCurrentTabRequest: null,
            nextRenameCurrentTabRequestId: 0,
            zoomPercent: APP_ZOOM_DEFAULT,
            theme: DEFAULT_APP_THEME,
            hotkeyBindings: {},
            editorSettings: DEFAULT_APP_EDITOR_SETTINGS,
            updaterSettings: DEFAULT_APP_UPDATER_SETTINGS,
            workspaceSettings: DEFAULT_APP_WORKSPACE_SETTINGS,
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
            requestRenameCurrentTab: () => {
                set((state) => {
                    const nextRenameCurrentTabRequestId =
                        state.nextRenameCurrentTabRequestId + 1;

                    return {
                        renameCurrentTabRequest: {
                            requestId: nextRenameCurrentTabRequestId,
                        },
                        nextRenameCurrentTabRequestId,
                    };
                });
            },
            clearRenameCurrentTabRequest: () => {
                set({ renameCurrentTabRequest: null });
            },
            selectSidebarItem: (item) => {
                set({ activeSidebarItem: item });
            },
            setZoomPercent: (zoomPercent) => {
                set({ zoomPercent: clampAppZoomPercent(zoomPercent) });
            },
            setTheme: (theme) => {
                set({ theme });
            },
            setHotkeyBinding: (action, binding) => {
                if (!binding) {
                    return;
                }

                set((state) => ({
                    hotkeyBindings: {
                        ...state.hotkeyBindings,
                        [action]: binding,
                    },
                }));
            },
            resetHotkeyBinding: (action) => {
                set((state) => {
                    const nextHotkeyBindings = { ...state.hotkeyBindings };

                    delete nextHotkeyBindings[action];

                    return {
                        hotkeyBindings: nextHotkeyBindings,
                    };
                });
            },
            resetAllHotkeyBindings: () => {
                set({
                    hotkeyBindings: {},
                });
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
            setMiddleClickTabAction: (action) => {
                set((state) => ({
                    workspaceSettings: {
                        ...state.workspaceSettings,
                        middleClickTabAction: action,
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
                const zoomPercent = clampAppZoomPercent(
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
                const hotkeyBindings = normalizeAppHotkeyBindings(
                    persistedAppState.hotkeyBindings,
                );
                const intellisenseWidth = normalizeAppIntellisenseWidth(
                    persistedAppState.editorSettings?.intellisenseWidth,
                );
                const middleClickTabAction = normalizeAppMiddleClickTabAction(
                    persistedAppState.workspaceSettings?.middleClickTabAction,
                );

                return {
                    ...currentState,
                    ...persistedAppState,
                    activeSidebarItem,
                    zoomPercent,
                    theme,
                    hotkeyBindings,
                    updaterSettings: {
                        ...currentState.updaterSettings,
                        ...persistedAppState.updaterSettings,
                    },
                    editorSettings: {
                        ...currentState.editorSettings,
                        ...persistedAppState.editorSettings,
                        intellisenseWidth,
                    },
                    workspaceSettings: {
                        ...currentState.workspaceSettings,
                        ...persistedAppState.workspaceSettings,
                        middleClickTabAction,
                    },
                };
            },
            partialize: (state) => ({
                isSidebarOpen: state.isSidebarOpen,
                activeSidebarItem: state.activeSidebarItem,
                zoomPercent: state.zoomPercent,
                theme: state.theme,
                hotkeyBindings: state.hotkeyBindings,
                updaterSettings: state.updaterSettings,
                editorSettings: state.editorSettings,
                workspaceSettings: state.workspaceSettings,
            }),
        },
    ),
);
