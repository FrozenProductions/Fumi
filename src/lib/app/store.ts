import {
    APP_EDITOR_CURSOR_STYLES,
    APP_EDITOR_TAB_SIZES,
    APP_INTELLISENSE_WIDTHS,
    APP_MIDDLE_CLICK_TAB_ACTIONS,
    APP_SIDEBAR_POSITIONS,
    APP_THEMES,
} from "../../constants/app/app";
import {
    APP_ZOOM_DEFAULT,
    APP_ZOOM_MAX,
    APP_ZOOM_MIN,
    DEFAULT_APP_EDITOR_CURSOR_STYLE,
    DEFAULT_APP_EDITOR_SETTINGS,
    DEFAULT_APP_EDITOR_TAB_SIZE,
    DEFAULT_APP_MIDDLE_CLICK_TAB_ACTION,
} from "../../constants/app/settings";
import { APP_SIDEBAR_ITEM_IDS } from "../../constants/app/sidebar";
import {
    WORKSPACE_OUTLINE_PANEL_MAX_WIDTH,
    WORKSPACE_OUTLINE_PANEL_MIN_WIDTH,
} from "../../constants/workspace/outline";
import { isNumberLiteral, isStringLiteral } from "../shared/validation";
import type {
    AppEditorCursorStyle,
    AppEditorTabSize,
    AppIntellisenseWidth,
    AppMiddleClickTabAction,
    AppTheme,
} from "./app.type";
import type { AppSidebarItem, AppSidebarPosition } from "./sidebar.type";

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

/**
 * Returns whether the value is a valid sidebar item identifier.
 */
export function isAppSidebarItem(value: unknown): value is AppSidebarItem {
    return isStringLiteral(value, APP_SIDEBAR_ITEM_IDS);
}

/**
 * Returns whether the value is a valid app theme.
 */
export function isAppTheme(value: unknown): value is AppTheme {
    return isStringLiteral(value, APP_THEMES);
}

/**
 * Returns whether the value is a valid sidebar position.
 */
export function isAppSidebarPosition(
    value: unknown,
): value is AppSidebarPosition {
    return isStringLiteral(value, APP_SIDEBAR_POSITIONS);
}

/**
 * Normalizes an editor tab size value, falling back to the default if invalid.
 */
export function normalizeAppEditorTabSize(value: unknown): AppEditorTabSize {
    return isNumberLiteral(value, APP_EDITOR_TAB_SIZES)
        ? value
        : DEFAULT_APP_EDITOR_TAB_SIZE;
}

/**
 * Normalizes an editor cursor style value, falling back to the default if invalid.
 */
export function normalizeAppEditorCursorStyle(
    value: unknown,
): AppEditorCursorStyle {
    return isStringLiteral(value, APP_EDITOR_CURSOR_STYLES)
        ? value
        : DEFAULT_APP_EDITOR_CURSOR_STYLE;
}

/**
 * Normalizes an intellisense width value, migrating legacy width names to current ones.
 */
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

    return isStringLiteral(value, APP_INTELLISENSE_WIDTHS)
        ? value
        : DEFAULT_APP_EDITOR_SETTINGS.intellisenseWidth;
}

/**
 * Normalizes a middle-click tab action value, falling back to the default if invalid.
 */
export function normalizeAppMiddleClickTabAction(
    value: unknown,
): AppMiddleClickTabAction {
    return isStringLiteral(value, APP_MIDDLE_CLICK_TAB_ACTIONS)
        ? value
        : DEFAULT_APP_MIDDLE_CLICK_TAB_ACTION;
}

/**
 * Normalizes an outline panel width, clamping to the valid range.
 */
export function normalizeAppOutlinePanelWidth(value: unknown): number {
    if (!Number.isFinite(value)) {
        return DEFAULT_APP_EDITOR_SETTINGS.outlinePanelWidth;
    }

    return Math.min(
        WORKSPACE_OUTLINE_PANEL_MAX_WIDTH,
        Math.max(WORKSPACE_OUTLINE_PANEL_MIN_WIDTH, Number(value)),
    );
}
