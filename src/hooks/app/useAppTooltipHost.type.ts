import type {
    TooltipPosition,
    TooltipStoreState,
} from "../../lib/tooltip/tooltipStore.type";

export type AppTooltipHostState = {
    activeTooltip: TooltipStoreState["activeTooltip"];
    isVisible: boolean;
    position: TooltipPosition;
    tooltipMeasureRef: React.RefObject<HTMLDivElement | null>;
};
