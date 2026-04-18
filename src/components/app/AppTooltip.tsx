import {
    cloneElement,
    type FocusEvent,
    type PointerEvent,
    type ReactElement,
    useEffect,
    useId,
    useRef,
} from "react";
import {
    DEFAULT_TOOLTIP_DELAY_MS,
    DEFAULT_TOOLTIP_OFFSET,
} from "../../constants/tooltip/tooltip";
import {
    selectActiveTooltipId,
    useTooltipStore,
} from "../../hooks/tooltip/useTooltipStore";
import {
    assignRef,
    markTooltipWarm,
    mergeAriaDescribedBy,
    scheduleTooltipCooldown,
    shouldSkipTooltipDelay,
} from "../../lib/tooltip/tooltip";
import type { AppTooltipProps } from "./appTooltip.type";

/**
 * Wrapper that displays a tooltip when the child element is hovered or focused.
 *
 * @param props - Component props
 * @param props.children - The trigger element
 * @param props.content - Tooltip text content
 * @param props.shortcut - Optional keyboard shortcut to display
 * @param props.side - Which side of the trigger to show tooltip
 * @param props.offset - Distance from trigger
 * @param props.delayMs - Delay before showing tooltip
 * @param props.disabled - Prevent tooltip from showing
 * @returns A React component
 */
export function AppTooltip({
    children,
    content,
    shortcut,
    side = "top",
    offset = DEFAULT_TOOLTIP_OFFSET,
    delayMs = DEFAULT_TOOLTIP_DELAY_MS,
    disabled = false,
}: AppTooltipProps): ReactElement {
    const activeTooltipId = useTooltipStore(selectActiveTooltipId);
    const hideTooltip = useTooltipStore((state) => state.hideTooltip);
    const showTooltip = useTooltipStore((state) => state.showTooltip);
    const tooltipId = useId();
    const openTimerRef = useRef<number | null>(null);
    const triggerElementRef = useRef<HTMLElement | null>(null);
    const childElement = children;
    const isVisible = !disabled && activeTooltipId === tooltipId;

    const clearOpenTimer = (): void => {
        if (openTimerRef.current === null) {
            return;
        }

        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
    };

    const openTooltip = (useDelay: boolean): void => {
        if (disabled || !triggerElementRef.current) {
            return;
        }

        clearOpenTimer();

        const show = (): void => {
            if (!triggerElementRef.current) {
                return;
            }

            markTooltipWarm();

            showTooltip({
                id: tooltipId,
                content,
                shortcut,
                side,
                offset,
                triggerElement: triggerElementRef.current,
            });
        };

        if (!useDelay || shouldSkipTooltipDelay()) {
            show();
            return;
        }

        openTimerRef.current = window.setTimeout(() => {
            show();
            openTimerRef.current = null;
        }, delayMs);
    };

    const closeTooltip = (): void => {
        clearOpenTimer();
        hideTooltip(tooltipId);
        scheduleTooltipCooldown();
    };

    useEffect(() => {
        return () => {
            if (openTimerRef.current !== null) {
                window.clearTimeout(openTimerRef.current);
            }

            hideTooltip(tooltipId);
        };
    }, [hideTooltip, tooltipId]);

    useEffect(() => {
        if (!disabled || activeTooltipId !== tooltipId) {
            return;
        }

        hideTooltip(tooltipId);
    }, [activeTooltipId, disabled, hideTooltip, tooltipId]);

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

    if (disabled) {
        return children;
    }

    return cloneElement(childElement, {
        ref: (node: HTMLElement | null) => {
            triggerElementRef.current = node;
            assignRef(childElement.props.ref, node);
        },
        "aria-describedby": mergeAriaDescribedBy(
            childElement.props["aria-describedby"],
            tooltipId,
            isVisible,
        ),
        onPointerEnter: (event: PointerEvent<HTMLElement>) => {
            childElement.props.onPointerEnter?.(event);

            if (!event.defaultPrevented) {
                openTooltip(true);
            }
        },
        onPointerLeave: (event: PointerEvent<HTMLElement>) => {
            childElement.props.onPointerLeave?.(event);

            if (!event.defaultPrevented) {
                closeTooltip();
            }
        },
        onFocus: (event: FocusEvent<HTMLElement>) => {
            childElement.props.onFocus?.(event);

            if (
                !event.defaultPrevented &&
                event.currentTarget.matches(":focus-visible")
            ) {
                openTooltip(false);
            }
        },
        onBlur: (event: FocusEvent<HTMLElement>) => {
            childElement.props.onBlur?.(event);

            if (!event.defaultPrevented) {
                closeTooltip();
            }
        },
        onPointerDown: (event: PointerEvent<HTMLElement>) => {
            childElement.props.onPointerDown?.(event);

            if (!event.defaultPrevented) {
                closeTooltip();
            }
        },
    });
}
