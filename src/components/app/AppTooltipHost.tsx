import { type ReactElement, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AppTooltipLayer } from "../../components/app/AppTooltipLayer";
import { TOOLTIP_VIEWPORT_MARGIN } from "../../constants/tooltip/tooltip";
import {
    type TooltipPosition,
    useTooltipStore,
} from "../../hooks/tooltip/useTooltipStore";
import { clamp } from "../../lib/shared/math";
import type { TooltipSide } from "../../lib/tooltip/tooltip.type";

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

export function AppTooltipHost(): ReactElement | null {
    const activeTooltip = useTooltipStore((state) => state.activeTooltip);
    const position = useTooltipStore((state) => state.position);
    const isVisible = useTooltipStore((state) => state.isVisible);
    const clearTooltip = useTooltipStore((state) => state.clearTooltip);
    const setTooltipPosition = useTooltipStore(
        (state) => state.setTooltipPosition,
    );
    const setTooltipVisibility = useTooltipStore(
        (state) => state.setTooltipVisibility,
    );
    const tooltipMeasureRef = useRef<HTMLDivElement | null>(null);
    const activeTooltipIdRef = useRef<string | null>(null);

    useLayoutEffect(() => {
        if (!activeTooltip) {
            setTooltipVisibility(false);
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
                clearTooltip();
                return;
            }

            const triggerRect =
                activeTooltip.triggerElement.getBoundingClientRect();

            setTooltipPosition(
                calculateTooltipPosition(
                    triggerRect,
                    {
                        width: tooltipElement.offsetWidth,
                        height: tooltipElement.offsetHeight,
                    },
                    activeTooltip.side,
                    activeTooltip.offset,
                ),
            );
        };

        updatePosition();

        if (activeTooltip.id !== activeTooltipIdRef.current) {
            setTooltipVisibility(false);
            frameId = requestAnimationFrame(() => {
                setTooltipVisibility(true);
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
    }, [activeTooltip, clearTooltip, setTooltipPosition, setTooltipVisibility]);

    useEffect(() => {
        if (!activeTooltip) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                clearTooltip();
            }
        };

        window.addEventListener("blur", clearTooltip);
        window.addEventListener("pointerdown", clearTooltip);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("blur", clearTooltip);
            window.removeEventListener("pointerdown", clearTooltip);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeTooltip, clearTooltip]);

    if (!activeTooltip) {
        return null;
    }

    return createPortal(
        <AppTooltipLayer
            ref={tooltipMeasureRef}
            id={activeTooltip.id}
            content={activeTooltip.content}
            shortcut={activeTooltip.shortcut}
            side={activeTooltip.side}
            top={position.top}
            left={position.left}
            isVisible={isVisible}
        />,
        document.body,
    );
}
