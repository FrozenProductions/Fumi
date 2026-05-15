import type { FocusEvent, PointerEvent, ReactElement } from "react";
import { cloneElement, useId } from "react";
import {
    DEFAULT_TOOLTIP_DELAY_MS,
    DEFAULT_TOOLTIP_OFFSET,
} from "../../../constants/tooltip/tooltip";
import { useAppTooltipTrigger } from "../../../hooks/app/useAppTooltipTrigger";
import { assignRef, mergeAriaDescribedBy } from "../../../lib/tooltip/tooltip";
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
    const tooltipId = useId();
    const { closeTooltip, isVisible, openTooltip, triggerElementRef } =
        useAppTooltipTrigger({
            content,
            delayMs,
            disabled,
            offset,
            shortcut,
            side,
            tooltipId,
        });
    const childElement = children;

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
