import {
    COMPLETION_POPUP_DETAIL_FONT,
    COMPLETION_POPUP_LABEL_FONT,
    COMPLETION_POPUP_LARGE_MIN_WIDTH,
    COMPLETION_POPUP_MIN_WIDTH,
    COMPLETION_POPUP_NORMAL_WIDTH,
    COMPLETION_POPUP_SMALL_WIDTH,
    COMPLETION_POPUP_VIEWPORT_PADDING,
} from "../../constants/luau/luau";
import type {
    LuauCompletionItem,
    LuauCompletionPopupPosition,
} from "../../lib/luau/luau.type";
import type { AppIntellisenseWidth } from "../app/app.type";

let completionMeasurementContext: CanvasRenderingContext2D | null = null;

export function getCompactLuauCompletionDetailLabel(detail: string): string {
    if (detail.startsWith("sunc")) {
        return "sunc";
    }

    if (detail.startsWith("unc")) {
        return "unc";
    }

    if (detail.startsWith("actors")) {
        return "actors";
    }

    if (detail.startsWith("ranket")) {
        return "ranket";
    }

    return detail;
}

function measureTextWidth(text: string, font: string): number {
    if (typeof document === "undefined") {
        return text.length * 8;
    }

    if (!completionMeasurementContext) {
        completionMeasurementContext = document
            .createElement("canvas")
            .getContext("2d");
    }

    if (!completionMeasurementContext) {
        return text.length * 8;
    }

    completionMeasurementContext.font = font;
    return completionMeasurementContext.measureText(text).width;
}

function getCompletionPopupWidth(
    items: readonly LuauCompletionItem[],
    intellisenseWidth: AppIntellisenseWidth,
): number {
    const maxWidth = window.innerWidth - COMPLETION_POPUP_VIEWPORT_PADDING * 2;

    if (intellisenseWidth === "small") {
        return Math.min(maxWidth, COMPLETION_POPUP_SMALL_WIDTH);
    }

    if (intellisenseWidth === "normal") {
        return Math.min(maxWidth, COMPLETION_POPUP_NORMAL_WIDTH);
    }

    const rowGap = 8;
    const rowHorizontalPadding = 16;
    const badgeHorizontalPadding = 12;
    const badgeTrackingWidthPerCharacter = 0.75;
    const containerHorizontalPadding = 12;
    const borderAllowance = 2;
    const widthSafetyMargin = 18;

    let widestContentWidth = 0;

    for (const item of items) {
        const compactDetail = getCompactLuauCompletionDetailLabel(item.detail);
        const labelWidth = measureTextWidth(
            item.label,
            COMPLETION_POPUP_LABEL_FONT,
        );
        const detailWidth =
            measureTextWidth(compactDetail, COMPLETION_POPUP_DETAIL_FONT) +
            compactDetail.length * badgeTrackingWidthPerCharacter;
        const rowWidth =
            labelWidth +
            detailWidth +
            rowGap +
            rowHorizontalPadding +
            badgeHorizontalPadding +
            containerHorizontalPadding +
            borderAllowance +
            widthSafetyMargin;

        widestContentWidth = Math.max(widestContentWidth, rowWidth);
    }

    const dynamicWidth = Math.min(
        maxWidth,
        Math.max(COMPLETION_POPUP_MIN_WIDTH, Math.ceil(widestContentWidth)),
    );

    if (intellisenseWidth === "large") {
        return Math.min(
            maxWidth,
            Math.max(COMPLETION_POPUP_LARGE_MIN_WIDTH, dynamicWidth),
        );
    }

    return dynamicWidth;
}

/**
 * Calculates the position for the Luau completion popup relative to the caret.
 *
 * @remarks
 * Determines vertical placement (above/below caret) based on available space,
 * clamps position to viewport, and computes dynamic width based on content
 * and intellisense settings.
 */
export function getLuauCompletionPopupPosition(
    caretLeft: number,
    caretTop: number,
    items: readonly LuauCompletionItem[],
    intellisenseWidth: AppIntellisenseWidth,
    preferredVerticalPlacement?: LuauCompletionPopupPosition["verticalPlacement"],
): LuauCompletionPopupPosition {
    const width = getCompletionPopupWidth(items, intellisenseWidth);
    const visibleRowCount = Math.min(items.length, 6);
    const rowHeight = 28;
    const rowGap = 4;
    const containerPadding = 12;
    const estimatedHeight = Math.max(
        visibleRowCount * rowHeight +
            Math.max(visibleRowCount - 1, 0) * rowGap +
            containerPadding,
        28,
    );
    const belowTop = caretTop - 25;
    const spaceBelow =
        window.innerHeight - belowTop - COMPLETION_POPUP_VIEWPORT_PADDING;
    const spaceAbove = caretTop - COMPLETION_POPUP_VIEWPORT_PADDING;
    const canRenderAbove = spaceAbove >= 28;
    const canRenderBelow = spaceBelow >= 28;
    const shouldUsePreferredPlacement =
        preferredVerticalPlacement === "above"
            ? canRenderAbove
            : preferredVerticalPlacement === "below"
              ? canRenderBelow
              : false;
    const renderAbove = shouldUsePreferredPlacement
        ? preferredVerticalPlacement === "above"
        : spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const verticalPlacement = renderAbove ? "above" : "below";
    const maxHeight = Math.max(
        28,
        Math.min(estimatedHeight, renderAbove ? spaceAbove - 2 : spaceBelow),
    );

    return {
        verticalPlacement,
        left: Math.max(
            COMPLETION_POPUP_VIEWPORT_PADDING,
            Math.min(
                caretLeft - 42,
                window.innerWidth - width - COMPLETION_POPUP_VIEWPORT_PADDING,
            ),
        ),
        top: renderAbove
            ? Math.max(
                  COMPLETION_POPUP_VIEWPORT_PADDING,
                  caretTop - maxHeight - 16,
              )
            : belowTop,
        width,
        maxHeight,
    };
}
