import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_APP_STORE_STATE } from "../../constants/app/appStore";
import type { AppStore } from "../../lib/app/appStore.type";
import {
    getPersistedAppStoreState,
    mergeAppStoreState,
} from "../../lib/app/appStorePersistence";
import { isAppHotkeyOverride } from "../../lib/app/hotkeys/hotkeys";
import {
    clampAppZoomPercent,
    normalizeAppEditorCursorStyle,
    normalizeAppEditorTabSize,
    normalizeAppOutlinePanelWidth,
} from "../../lib/app/store";

/**
 * Global Zustand store for app-wide UI state, persisted to localStorage.
 *
 * Manages sidebar, command palette, theme, zoom, hotkey bindings, editor settings,
 * and workspace preferences. State is merged on hydration to handle schema migrations.
 */
export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            ...DEFAULT_APP_STORE_STATE,
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
            setEditorCursorStyle: (cursorStyle) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        cursorStyle: normalizeAppEditorCursorStyle(cursorStyle),
                    },
                }));
            },
            setEditorSmoothCaretEnabled: (isEnabled) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        isSmoothCaretEnabled: isEnabled,
                    },
                }));
            },
            setEditorScopeHighlightingEnabled: (isEnabled) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        isScopeHighlightingEnabled: isEnabled,
                    },
                }));
            },
            setEditorRelativeLineNumbersEnabled: (isEnabled) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        isRelativeLineNumbersEnabled: isEnabled,
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
            setEditorTabsToSpacesEnabled: (isEnabled) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        isTabsToSpacesEnabled: isEnabled,
                    },
                }));
            },
            setEditorTabSize: (tabSize) => {
                set((state) => ({
                    editorSettings: {
                        ...state.editorSettings,
                        tabSize: normalizeAppEditorTabSize(tabSize),
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
            setSplitViewArchiveScopeEnabled: (isEnabled) => {
                set((state) => ({
                    workspaceSettings: {
                        ...state.workspaceSettings,
                        isSplitViewArchiveScopeEnabled: isEnabled,
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
