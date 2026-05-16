import { useEffect, useLayoutEffect, useRef } from "react";
import { TOOLTIP_VIEWPORT_MARGIN } from "../../constants/tooltip/tooltip";
import { clamp } from "../../lib/shared/math";
import type { TooltipSide } from "../../lib/tooltip/tooltip.type";
import type { TooltipPosition } from "../../lib/tooltip/tooltipStore.type";
import type { AppTooltipHostState } from "./useAppTooltipHost.type";
import { useTooltipStore } from "./useTooltipStore";

function calculateTooltipPosition(
    triggerRect: DOMRect,
    tooltipRect: Pick<DOMRect, "width" | "height">,
    side: TooltipSide,
    offset: number,
): TooltipPosition {
    const maxLeft = Math.max(
        TOOLTIP_VIEWPORT_MARGIN,
        window.innerWidth - tooltipRect.width - TOOLTIP_VIEWPORT_MARGIN,
    );
    const maxTop = Math.max(
        TOOLTIP_VIEWPORT_MARGIN,
        window.innerHeight - tooltipRect.height - TOOLTIP_VIEWPORT_MARGIN,
    );

    switch (side) {
        case "top":
            return {
                top: clamp(
                    triggerRect.top - tooltipRect.height - offset,
                    TOOLTIP_VIEWPORT_MARGIN,
                    maxTop,
                ),
                left: clamp(
                    triggerRect.left +
                        triggerRect.width / 2 -
                        tooltipRect.width / 2,
                    TOOLTIP_VIEWPORT_MARGIN,
                    maxLeft,
                ),
            };
        case "right":
            return {
                top: clamp(
                    triggerRect.top +
                        triggerRect.height / 2 -
                        tooltipRect.height / 2,
                    TOOLTIP_VIEWPORT_MARGIN,
                    maxTop,
                ),
                left: clamp(
                    triggerRect.right + offset,
                    TOOLTIP_VIEWPORT_MARGIN,
                    maxLeft,
                ),
            };
        case "bottom":
            return {
                top: clamp(
                    triggerRect.bottom + offset,
                    TOOLTIP_VIEWPORT_MARGIN,
                    maxTop,
                ),
                left: clamp(
                    triggerRect.left +
                        triggerRect.width / 2 -
                        tooltipRect.width / 2,
                    TOOLTIP_VIEWPORT_MARGIN,
                    maxLeft,
                ),
            };
        case "left":
            return {
                top: clamp(
                    triggerRect.top +
                        triggerRect.height / 2 -
                        tooltipRect.height / 2,
                    TOOLTIP_VIEWPORT_MARGIN,
                    maxTop,
                ),
                left: clamp(
                    triggerRect.left - tooltipRect.width - offset,
                    TOOLTIP_VIEWPORT_MARGIN,
                    maxLeft,
                ),
            };
    }
}

/**
 * Manages tooltip positioning, visibility, and lifecycle as the host component.
 *
 * Subscribes to the tooltip store and calculates optimal position based on trigger
 * element bounds. Handles resize/scroll repositioning, escape key dismissal,
 * and pointer/blur events. Uses requestAnimationFrame for entrance animations.
 *
 * @returns Tooltip host state including position, visibility, and refs
 */
export function useAppTooltipHost(): AppTooltipHostState {
    const activeTooltip = useTooltipStore((state) => state.activeTooltip);
    const position = useTooltipStore((state) => state.position);
    const isVisible = useTooltipStore((state) => state.isVisible);
    const clearTooltip = useTooltipStore((state) => state.clearTooltip);
    const updateTooltipView = useTooltipStore(
        (state) => state.updateTooltipView,
    );
    const tooltipMeasureRef = useRef<HTMLDivElement | null>(null);
    const activeTooltipIdRef = useRef<string | null>(null);
    const clearTooltipRef = useRef(clearTooltip);
    clearTooltipRef.current = clearTooltip;

    useLayoutEffect(() => {
        if (!activeTooltip) {
            updateTooltipView({ isVisible: false });
            activeTooltipIdRef.current = null;
            return;
        }

        let frameId: number | null = null;

        const updatePosition = (): void => {
            const tooltipElement = tooltipMeasureRef.current;

            if (
                !tooltipElement ||
                !document.body.contains(activeTooltip.triggerElement)
            ) {
                clearTooltipRef.current();
                return;
            }

            const triggerRect =
                activeTooltip.triggerElement.getBoundingClientRect();

            updateTooltipView({
                position: calculateTooltipPosition(
                    triggerRect,
                    {
                        width: tooltipElement.offsetWidth,
                        height: tooltipElement.offsetHeight,
                    },
                    activeTooltip.side,
                    activeTooltip.offset,
                ),
            });
        };

        updatePosition();

        if (activeTooltip.id !== activeTooltipIdRef.current) {
            updateTooltipView({ isVisible: false });
            frameId = requestAnimationFrame(() => {
                updateTooltipView({ isVisible: true });
            });
            activeTooltipIdRef.current = activeTooltip.id;
        }

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);

            if (frameId !== null) {
                cancelAnimationFrame(frameId);
            }
        };
    }, [activeTooltip, updateTooltipView]);

    useEffect(() => {
        if (!activeTooltip) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                clearTooltipRef.current();
            }
        };

        const handleClearTooltip = (): void => {
            clearTooltipRef.current();
        };

        window.addEventListener("blur", handleClearTooltip);
        window.addEventListener("pointerdown", handleClearTooltip);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("blur", handleClearTooltip);
            window.removeEventListener("pointerdown", handleClearTooltip);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeTooltip]);

    return {
        activeTooltip,
        isVisible,
        position,
        tooltipMeasureRef,
    };
}
