import { APP_HOTKEY_DEFINITIONS } from "../../constants/app/hotkeys";
import { APP_ZOOM_DEFAULT } from "../../constants/app/settings";
import type { AppStore, AppStoreState } from "./appStore.type";
import { normalizeAppHotkeyBindings } from "./hotkeys/hotkeys";
import type { AppHotkeyAction } from "./hotkeys/hotkeys.type";
import {
    clampAppZoomPercent,
    isAppSidebarItem,
    isAppSidebarPosition,
    isAppTheme,
    normalizeAppEditorCursorStyle,
    normalizeAppEditorTabSize,
    normalizeAppIntellisenseWidth,
    normalizeAppMiddleClickTabAction,
    normalizeAppOutlinePanelWidth,
} from "./store";

/**
 * Merges persisted app store state into the current store, validating and
 * normalizing values that may be outdated or invalid after an app update.
 *
 * @param persistedState - The raw persisted state from localStorage
 * @param currentState - The current Zustand store state with defaults
 * @returns The merged store state with validated values
 */
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
    const disabledHotkeys = normalizeAppDisabledHotkeys(
        persistedAppState.disabledHotkeys,
    );
    const intellisenseWidth = normalizeAppIntellisenseWidth(
        persistedAppState.editorSettings?.intellisenseWidth,
    );
    const cursorStyle = normalizeAppEditorCursorStyle(
        persistedAppState.editorSettings?.cursorStyle,
    );
    const isSmoothCaretEnabled =
        typeof persistedAppState.editorSettings?.isSmoothCaretEnabled ===
        "boolean"
            ? persistedAppState.editorSettings.isSmoothCaretEnabled
            : currentState.editorSettings.isSmoothCaretEnabled;
    const isScopeHighlightingEnabled =
        typeof persistedAppState.editorSettings?.isScopeHighlightingEnabled ===
        "boolean"
            ? persistedAppState.editorSettings.isScopeHighlightingEnabled
            : currentState.editorSettings.isScopeHighlightingEnabled;
    const isRelativeLineNumbersEnabled =
        typeof persistedAppState.editorSettings
            ?.isRelativeLineNumbersEnabled === "boolean"
            ? persistedAppState.editorSettings.isRelativeLineNumbersEnabled
            : currentState.editorSettings.isRelativeLineNumbersEnabled;
    const isWordWrapEnabled =
        typeof persistedAppState.editorSettings?.isWordWrapEnabled === "boolean"
            ? persistedAppState.editorSettings.isWordWrapEnabled
            : currentState.editorSettings.isWordWrapEnabled;
    const isTabsToSpacesEnabled =
        typeof persistedAppState.editorSettings?.isTabsToSpacesEnabled ===
        "boolean"
            ? persistedAppState.editorSettings.isTabsToSpacesEnabled
            : currentState.editorSettings.isTabsToSpacesEnabled;
    const tabSize = normalizeAppEditorTabSize(
        persistedAppState.editorSettings?.tabSize,
    );
    const outlinePanelWidth = normalizeAppOutlinePanelWidth(
        persistedAppState.editorSettings?.outlinePanelWidth,
    );
    const middleClickTabAction = normalizeAppMiddleClickTabAction(
        persistedAppState.workspaceSettings?.middleClickTabAction,
    );
    const isSplitViewArchiveScopeEnabled =
        typeof persistedAppState.workspaceSettings
            ?.isSplitViewArchiveScopeEnabled === "boolean"
            ? persistedAppState.workspaceSettings.isSplitViewArchiveScopeEnabled
            : currentState.workspaceSettings.isSplitViewArchiveScopeEnabled;
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
        disabledHotkeys,
        sidebarPosition,
        updaterSettings: {
            ...currentState.updaterSettings,
            ...persistedAppState.updaterSettings,
        },
        editorSettings: {
            ...currentState.editorSettings,
            ...persistedAppState.editorSettings,
            cursorStyle,
            isSmoothCaretEnabled,
            isScopeHighlightingEnabled,
            isRelativeLineNumbersEnabled,
            isWordWrapEnabled,
            isTabsToSpacesEnabled,
            tabSize,
            intellisenseWidth,
            outlinePanelWidth,
        },
        workspaceSettings: {
            ...currentState.workspaceSettings,
            ...persistedAppState.workspaceSettings,
            middleClickTabAction,
            isSplitViewArchiveScopeEnabled,
        },
    };
}

/**
 * Extracts the subset of app store state that should be persisted to localStorage.
 *
 * @param state - The full app store state
 * @returns A partial state object containing only the persistable fields
 */
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
        disabledHotkeys: state.disabledHotkeys,
        updaterSettings: state.updaterSettings,
        editorSettings: state.editorSettings,
        workspaceSettings: state.workspaceSettings,
        sidebarPosition: state.sidebarPosition,
    };
}

function isValidDisabledHotkey(value: unknown): value is AppHotkeyAction {
    if (typeof value !== "string") {
        return false;
    }

    const definition = APP_HOTKEY_DEFINITIONS[value as AppHotkeyAction];

    return definition?.isEditable === true;
}

function normalizeAppDisabledHotkeys(value: unknown): AppHotkeyAction[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(isValidDisabledHotkey);
}
