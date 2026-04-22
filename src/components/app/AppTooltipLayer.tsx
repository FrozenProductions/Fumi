import type { CSSProperties } from "react";
import { forwardRef } from "react";
import { TOOLTIP_HIDDEN_MOTION_CLASS_NAMES } from "../../constants/tooltip/tooltip";
import type { AppTooltipLayerProps } from "./appTooltip.type";

/**
 * The actual tooltip layer rendered via portal with positioning and animation.
 *
 * @param props - Component props
 * @param props.content - Tooltip text content
 * @param props.shortcut - Optional keyboard shortcut to display
 * @param props.side - Which side to render relative to trigger
 * @param props.top - Vertical position
 * @param props.left - Horizontal position
 * @param props.isVisible - Whether tooltip should be visible
 * @returns A styled tooltip div
 */
export const AppTooltipLayer = forwardRef<HTMLDivElement, AppTooltipLayerProps>(
    function AppTooltipLayer(
        {
            id,
            content,
            shortcut,
            side,
            top,
            left,
            isVisible,
        }: AppTooltipLayerProps,
        ref,
    ) {
        const motionClassName = isVisible
            ? "translate-x-0 translate-y-0 opacity-100 scale-100"
            : `${TOOLTIP_HIDDEN_MOTION_CLASS_NAMES[side]} opacity-0 scale-95`;
        const tooltipStyle = {
            top,
            left,
        } satisfies CSSProperties;

        return (
            <div
                ref={ref}
                id={id}
                role="tooltip"
                aria-hidden={!isVisible}
                className={`pointer-events-none fixed z-[80] flex select-none items-center gap-1.5 whitespace-nowrap rounded-[0.65rem] bg-fumi-50 px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-fumi-900 ring-1 ring-fumi-200 shadow-[var(--shadow-app-floating)] transition-[opacity,transform] duration-100 ease-out will-change-[transform,opacity] ${motionClassName}`}
                style={tooltipStyle}
            >
                <span>{content}</span>
                {shortcut && (
                    <span className="flex items-center gap-[3px] rounded-[0.2rem] bg-fumi-50/50 px-1 py-[2px] text-[10px] font-semibold leading-none text-fumi-400 ring-1 ring-inset ring-fumi-200/50">
                        {shortcut}
                    </span>
                )}
            </div>
        );
    },
);
