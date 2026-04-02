import type {
    LuauCompletionItem,
    LuauCompletionPopupPosition,
} from "../../lib/luau/luau.type";

let completionMeasurementContext: CanvasRenderingContext2D | null = null;

const COMPLETION_POPUP_VIEWPORT_PADDING = 16;
const COMPLETION_POPUP_MIN_WIDTH = 188;
const COMPLETION_POPUP_LABEL_FONT =
    '600 10px "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
const COMPLETION_POPUP_DETAIL_FONT =
    '600 7.5px "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';

export function getCompactLuauCompletionDetailLabel(detail: string): string {
    if (detail.startsWith("sunc")) {
        return "sunc";
    }

    if (detail.startsWith("unc")) {
        return "unc";
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

function getCompletionPopupWidth(items: readonly LuauCompletionItem[]): number {
    const maxWidth = window.innerWidth - COMPLETION_POPUP_VIEWPORT_PADDING * 2;
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

    return Math.min(
        maxWidth,
        Math.max(COMPLETION_POPUP_MIN_WIDTH, Math.ceil(widestContentWidth)),
    );
}

export function getLuauCompletionPopupPosition(
    caretLeft: number,
    caretTop: number,
    items: readonly LuauCompletionItem[],
): LuauCompletionPopupPosition {
    const width = getCompletionPopupWidth(items);
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
    const renderAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
        28,
        Math.min(estimatedHeight, renderAbove ? spaceAbove - 2 : spaceBelow),
    );

    return {
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
