import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
    APP_ZOOM_DEFAULT,
    DEFAULT_APP_EDITOR_SETTINGS,
    DEFAULT_APP_SIDEBAR_POSITION,
    DEFAULT_APP_STREAMER_MODE_ENABLED,
    DEFAULT_APP_THEME,
    DEFAULT_APP_UPDATER_SETTINGS,
    DEFAULT_APP_WORKSPACE_SETTINGS,
} from "../../constants/app/settings";
import {
    isAppHotkeyOverride,
    normalizeAppHotkeyBindings,
} from "../../lib/app/hotkeys";
import {
    clampAppZoomPercent,
    isAppSidebarItem,
    isAppSidebarPosition,
    isAppTheme,
    normalizeAppIntellisenseWidth,
    normalizeAppMiddleClickTabAction,
    normalizeAppOutlinePanelWidth,
} from "../../lib/app/store";
import type { AppStore, AppStoreState } from "./appStore.type";

export function mergeAppStoreState(
    persistedState: unknown,
    currentState: AppStore,
): AppStore {
    const persistedAppState = (persistedState as Partial<AppStoreState>) ?? {};
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
    const isWordWrapEnabled =
        typeof persistedAppState.editorSettings?.isWordWrapEnabled === "boolean"
            ? persistedAppState.editorSettings.isWordWrapEnabled
            : currentState.editorSettings.isWordWrapEnabled;
    const outlinePanelWidth = normalizeAppOutlinePanelWidth(
        persistedAppState.editorSettings?.outlinePanelWidth,
    );
    const middleClickTabAction = normalizeAppMiddleClickTabAction(
        persistedAppState.workspaceSettings?.middleClickTabAction,
    );
    const sidebarPosition = isAppSidebarPosition(
        persistedAppState.sidebarPosition,
    )
        ? persistedAppState.sidebarPosition
        : currentState.sidebarPosition;
    const isStreamerModeEnabled =
        typeof persistedAppState.isStreamerModeEnabled === "boolean"
            ? persistedAppState.isStreamerModeEnabled
            : currentState.isStreamerModeEnabled;

    return {
        ...currentState,
        ...persistedAppState,
        activeSidebarItem,
        zoomPercent,
        theme,
        isStreamerModeEnabled,
        hotkeyBindings,
        sidebarPosition,
        updaterSettings: {
            ...currentState.updaterSettings,
            ...persistedAppState.updaterSettings,
        },
        editorSettings: {
            ...currentState.editorSettings,
            ...persistedAppState.editorSettings,
            isWordWrapEnabled,
            intellisenseWidth,
            outlinePanelWidth,
        },
        workspaceSettings: {
            ...currentState.workspaceSettings,
            ...persistedAppState.workspaceSettings,
            middleClickTabAction,
        },
    };
}

export function getPersistedAppStoreState(
    state: AppStore,
): Partial<AppStoreState> {
    return {
        isSidebarOpen: state.isSidebarOpen,
        activeSidebarItem: state.activeSidebarItem,
        zoomPercent: state.zoomPercent,
        theme: state.theme,
        isStreamerModeEnabled: state.isStreamerModeEnabled,
        hotkeyBindings: state.hotkeyBindings,
        updaterSettings: state.updaterSettings,
        editorSettings: state.editorSettings,
        workspaceSettings: state.workspaceSettings,
        sidebarPosition: state.sidebarPosition,
    };
}

/**
 * Global application state store for Fumi.
 *
 * Persists user preferences including sidebar visibility, zoom level, theme,
 * hotkey bindings, editor settings, and workspace settings to localStorage.
 */
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
            isStreamerModeEnabled: DEFAULT_APP_STREAMER_MODE_ENABLED,
            hotkeyBindings: {},
            editorSettings: DEFAULT_APP_EDITOR_SETTINGS,
            updaterSettings: DEFAULT_APP_UPDATER_SETTINGS,
            workspaceSettings: DEFAULT_APP_WORKSPACE_SETTINGS,
            sidebarPosition: DEFAULT_APP_SIDEBAR_POSITION,
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

                set((state) => {
                    if (!isAppHotkeyOverride(action, binding)) {
                        if (state.hotkeyBindings[action] === undefined) {
                            return state;
                        }

                        const nextHotkeyBindings = { ...state.hotkeyBindings };
                        delete nextHotkeyBindings[action];

                        return {
                            hotkeyBindings: nextHotkeyBindings,
                        };
                    }

                    return {
                        hotkeyBindings: {
                            ...state.hotkeyBindings,
                            [action]: binding,
                        },
                    };
                });
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
            setStreamerModeEnabled: (isEnabled) => {
                set({ isStreamerModeEnabled: isEnabled });
            },
            setEditorFontSize: (fontSize) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        fontSize,
                    },
                }));
            },
            setEditorWordWrapEnabled: (isEnabled) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        isWordWrapEnabled: isEnabled,
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
            setOutlinePanelWidth: (width) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        outlinePanelWidth: normalizeAppOutlinePanelWidth(width),
                    },
                }));
            },
            setOutlineExpandedGroups: (patch) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        outlineExpandedGroups: {
                            ...state.editorSettings.outlineExpandedGroups,
                            ...patch,
                        },
                    },
                }));
            },
            setOutlineSearchQuery: (query) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        outlineSearchQuery: query,
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
            setSidebarPosition: (position) => {
                set({ sidebarPosition: position });
            },
            toggleOutlinePanel: () => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        isOutlinePanelVisible:
                            !state.editorSettings.isOutlinePanelVisible,
                    },
                }));
            },
        }),
        {
            name: "fumi-app-store",
            storage: createJSONStorage(() => localStorage),
            merge: mergeAppStoreState,
            partialize: getPersistedAppStoreState,
        },
    ),
);
