import type { ReactNode } from "react";
import type { TooltipSide } from "../../lib/tooltip/tooltip.type";

export type TooltipDefinition = {
    id: string;
    content: ReactNode;
    shortcut?: ReactNode;
    side: TooltipSide;
    offset: number;
    triggerElement: HTMLElement;
};

export type TooltipPosition = {
    top: number;
    left: number;
};

export type TooltipStoreState = {
    activeTooltip: TooltipDefinition | null;
    position: TooltipPosition;
    isVisible: boolean;
};

export type TooltipStoreActions = {
    showTooltip: (definition: TooltipDefinition) => void;
    hideTooltip: (id?: string) => void;
    clearTooltip: () => void;
    setTooltipPosition: (position: TooltipPosition) => void;
    setTooltipVisibility: (isVisible: boolean) => void;
};

export type TooltipStore = TooltipStoreState & TooltipStoreActions;
