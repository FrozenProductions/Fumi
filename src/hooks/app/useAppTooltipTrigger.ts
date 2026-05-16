import type { ReactNode, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
    markTooltipWarm,
    scheduleTooltipCooldown,
    shouldSkipTooltipDelay,
} from "../../lib/tooltip/tooltip";
import type { TooltipSide } from "../../lib/tooltip/tooltip.type";
import { useTooltipStore } from "./useTooltipStore";

type UseAppTooltipTriggerOptions = {
    content: ReactNode;
    delayMs: number;
    disabled: boolean;
    offset: number;
    shortcut?: ReactNode;
    side: TooltipSide;
    tooltipId: string;
};

type UseAppTooltipTriggerResult = {
    closeTooltip: () => void;
    isVisible: boolean;
    openTooltip: (useDelay: boolean) => void;
    triggerElementRef: RefObject<HTMLElement | null>;
};

/**
 * Manages tooltip trigger behavior including delayed showing, hiding, and lifecycle.
 *
 * Attaches to a trigger element via ref, shows tooltip on hover/focus with configurable
 * delay, and hides on blur/click. Supports disabling tooltips and respects skip-delay
 * conditions for immediate display.
 *
 * @param options - Configuration for the tooltip trigger
 * @param options.content - Tooltip content to display
 * @param options.delayMs - Delay before showing tooltip
 * @param options.disabled - Whether the tooltip is disabled
 * @param options.offset - Distance from trigger element
 * @param options.shortcut - Optional shortcut to display
 * @param options.side - Which side to show the tooltip
 * @param options.tooltipId - Unique identifier for the tooltip
 * @returns Tooltip visibility state, ref, and open/close handlers
 */
export function useAppTooltipTrigger({
    content,
    delayMs,
    disabled,
    offset,
    shortcut,
    side,
    tooltipId,
}: UseAppTooltipTriggerOptions): UseAppTooltipTriggerResult {
    const hideTooltip = useTooltipStore((state) => state.hideTooltip);
    const showTooltip = useTooltipStore((state) => state.showTooltip);
    const openTimerRef = useRef<number | null>(null);
    const triggerElementRef = useRef<HTMLElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    function clearOpenTimer(): void {
        if (openTimerRef.current === null) {
            return;
        }

        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
    }

    function showCurrentTooltip(): void {
        if (!triggerElementRef.current) {
            return;
        }

        markTooltipWarm();
        setIsVisible(true);

        showTooltip({
            id: tooltipId,
            content,
            shortcut,
            side,
            offset,
            triggerElement: triggerElementRef.current,
        });
    }

    function openTooltip(useDelay: boolean): void {
        if (disabled || !triggerElementRef.current) {
            return;
        }

        clearOpenTimer();

        if (!useDelay || shouldSkipTooltipDelay()) {
            showCurrentTooltip();
            return;
        }

        openTimerRef.current = window.setTimeout(() => {
            showCurrentTooltip();
            openTimerRef.current = null;
        }, delayMs);
    }

    function closeTooltip(): void {
        clearOpenTimer();
        setIsVisible(false);
        hideTooltip(tooltipId);
        scheduleTooltipCooldown();
    }

    useEffect(() => {
        return () => {
            if (openTimerRef.current !== null) {
                window.clearTimeout(openTimerRef.current);
            }

            setIsVisible(false);
            hideTooltip(tooltipId);
        };
    }, [hideTooltip, tooltipId]);

    useEffect(() => {
        if (!disabled || !isVisible) {
            return;
        }

        setIsVisible(false);
        hideTooltip(tooltipId);
    }, [disabled, hideTooltip, isVisible, tooltipId]);

    useEffect(() => {
        if (!isVisible || !triggerElementRef.current) {
            return;
        }

        showTooltip({
            id: tooltipId,
            content,
            shortcut,
            side,
            offset,
            triggerElement: triggerElementRef.current,
        });
    }, [content, shortcut, isVisible, offset, showTooltip, side, tooltipId]);

    useEffect(() => {
        if (!isVisible) {
            return;
        }

        return useTooltipStore.subscribe((state) => {
            if (state.activeTooltip?.id !== tooltipId) {
                setIsVisible(false);
            }
        });
    }, [isVisible, tooltipId]);

    return {
        closeTooltip,
        isVisible,
        openTooltip,
        triggerElementRef,
    };
}
