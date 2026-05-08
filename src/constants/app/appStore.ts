import type { AppStoreState } from "../../lib/app/appStore.type";
import {
    APP_ZOOM_DEFAULT,
    DEFAULT_APP_EDITOR_SETTINGS,
    DEFAULT_APP_SIDEBAR_POSITION,
    DEFAULT_APP_STREAMER_MODE_ENABLED,
    DEFAULT_APP_THEME,
    DEFAULT_APP_UPDATER_SETTINGS,
    DEFAULT_APP_WORKSPACE_SETTINGS,
} from "./settings";

export const DEFAULT_APP_STORE_STATE = {
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
} satisfies AppStoreState;
