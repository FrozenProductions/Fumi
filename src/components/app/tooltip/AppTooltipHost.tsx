import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { useAppTooltipHost } from "../../../hooks/app/useAppTooltipHost";
import { AppTooltipLayer } from "./AppTooltipLayer";

/**
 * Renders active tooltips as a portal to the document body.
 *
 * Manages tooltip positioning relative to trigger elements and handles
 * viewport boundary clamping.
 *
 * @returns A React portal component or null
 */
export function AppTooltipHost(): ReactElement | null {
    const { activeTooltip, isVisible, position, tooltipMeasureRef } =
        useAppTooltipHost();

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
