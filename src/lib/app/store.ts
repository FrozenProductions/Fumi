import {
    APP_INTELLISENSE_WIDTHS,
    APP_MIDDLE_CLICK_TAB_ACTIONS,
    APP_SIDEBAR_POSITIONS,
    APP_THEMES,
} from "../../constants/app/app";
import {
    APP_ZOOM_DEFAULT,
    APP_ZOOM_MAX,
    APP_ZOOM_MIN,
    DEFAULT_APP_EDITOR_SETTINGS,
    DEFAULT_APP_MIDDLE_CLICK_TAB_ACTION,
    DEFAULT_APP_SIDEBAR_POSITION,
} from "../../constants/app/settings";
import { APP_SIDEBAR_ITEM_IDS } from "../../constants/app/sidebar";
import {
    WORKSPACE_OUTLINE_PANEL_MAX_WIDTH,
    WORKSPACE_OUTLINE_PANEL_MIN_WIDTH,
} from "../../constants/workspace/outline";
import type {
    AppIntellisenseWidth,
    AppMiddleClickTabAction,
    AppSidebarItem,
    AppSidebarPosition,
    AppTheme,
} from "./app.type";

export {
    APP_INTELLISENSE_WIDTHS,
    APP_MIDDLE_CLICK_TAB_ACTIONS,
    APP_SIDEBAR_POSITIONS,
    APP_THEMES,
};

/**
 * Clamps a zoom percentage value to the valid range [APP_ZOOM_MIN, APP_ZOOM_MAX].
 *
 * @remarks
 * Returns APP_ZOOM_DEFAULT for non-finite values like Infinity or NaN.
 */
export function clampAppZoomPercent(zoomPercent: number): number {
    if (!Number.isFinite(zoomPercent)) {
        return APP_ZOOM_DEFAULT;
    }

    return Math.min(APP_ZOOM_MAX, Math.max(APP_ZOOM_MIN, zoomPercent));
}

export function isAppSidebarItem(value: unknown): value is AppSidebarItem {
    return (
        typeof value === "string" &&
        APP_SIDEBAR_ITEM_IDS.includes(value as AppSidebarItem)
    );
}

export function isAppTheme(value: unknown): value is AppTheme {
    return typeof value === "string" && APP_THEMES.includes(value as AppTheme);
}

export function isAppSidebarPosition(
    value: unknown,
): value is AppSidebarPosition {
    return (
        typeof value === "string" &&
        APP_SIDEBAR_POSITIONS.includes(value as AppSidebarPosition)
    );
}

export function normalizeAppSidebarPosition(
    value: unknown,
): AppSidebarPosition {
    return isAppSidebarPosition(value) ? value : DEFAULT_APP_SIDEBAR_POSITION;
}

export function normalizeAppIntellisenseWidth(
    value: unknown,
): AppIntellisenseWidth {
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

export function normalizeAppMiddleClickTabAction(
    value: unknown,
): AppMiddleClickTabAction {
    return typeof value === "string" &&
        APP_MIDDLE_CLICK_TAB_ACTIONS.includes(value as AppMiddleClickTabAction)
        ? (value as AppMiddleClickTabAction)
        : DEFAULT_APP_MIDDLE_CLICK_TAB_ACTION;
}

export function normalizeAppOutlinePanelWidth(value: unknown): number {
    if (!Number.isFinite(value)) {
        return DEFAULT_APP_EDITOR_SETTINGS.outlinePanelWidth;
    }

    return Math.min(
        WORKSPACE_OUTLINE_PANEL_MAX_WIDTH,
        Math.max(WORKSPACE_OUTLINE_PANEL_MIN_WIDTH, Number(value)),
    );
}
