import type { TooltipPosition } from "../../hooks/tooltip/useTooltipStore.type";
import type { TooltipSide } from "../../lib/tooltip/tooltip.type";

export const TOOLTIP_VIEWPORT_MARGIN = 8;
export const DEFAULT_TOOLTIP_DELAY_MS = 1000;
export const DEFAULT_TOOLTIP_OFFSET = 10;
export const TOOLTIP_WARM_RESET_DELAY_MS = 300;
export const INITIAL_TOOLTIP_POSITION = {
    top: TOOLTIP_VIEWPORT_MARGIN,
    left: TOOLTIP_VIEWPORT_MARGIN,
} satisfies TooltipPosition;

export const TOOLTIP_HIDDEN_MOTION_CLASS_NAMES: Record<TooltipSide, string> = {
    top: "translate-y-1.5",
    right: "-translate-x-1.5",
    bottom: "-translate-y-1.5",
    left: "translate-x-1.5",
};
