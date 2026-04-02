import type { ReactNode } from "react";
import { create } from "zustand";
import { TOOLTIP_VIEWPORT_MARGIN } from "../../constants/tooltip/tooltip";
import type { TooltipSide } from "../../lib/tooltip/tooltip.type";

type TooltipDefinition = {
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

type TooltipStoreState = {
    activeTooltip: TooltipDefinition | null;
    position: TooltipPosition;
    isVisible: boolean;
};

type TooltipStoreActions = {
    showTooltip: (definition: TooltipDefinition) => void;
    hideTooltip: (id?: string) => void;
    clearTooltip: () => void;
    setTooltipPosition: (position: TooltipPosition) => void;
    setTooltipVisibility: (isVisible: boolean) => void;
};

type TooltipStore = TooltipStoreState & TooltipStoreActions;

const INITIAL_TOOLTIP_POSITION = {
    top: TOOLTIP_VIEWPORT_MARGIN,
    left: TOOLTIP_VIEWPORT_MARGIN,
} satisfies TooltipPosition;

export const selectActiveTooltipId = (state: TooltipStore): string | null =>
    state.activeTooltip?.id ?? null;

export const useTooltipStore = create<TooltipStore>((set) => ({
    activeTooltip: null,
    position: INITIAL_TOOLTIP_POSITION,
    isVisible: false,
    showTooltip: (definition) => {
        set((state) => {
            const currentTooltip = state.activeTooltip;

            if (
                currentTooltip &&
                currentTooltip.id === definition.id &&
                currentTooltip.content === definition.content &&
                currentTooltip.shortcut === definition.shortcut &&
                currentTooltip.side === definition.side &&
                currentTooltip.offset === definition.offset &&
                currentTooltip.triggerElement === definition.triggerElement
            ) {
                return state;
            }

            return {
                activeTooltip: definition,
            };
        });
    },
    hideTooltip: (id) => {
        set((state) => {
            if (!state.activeTooltip) {
                return state;
            }

            if (id && state.activeTooltip.id !== id) {
                return state;
            }

            return {
                activeTooltip: null,
                isVisible: false,
            };
        });
    },
    clearTooltip: () => {
        set({
            activeTooltip: null,
            isVisible: false,
        });
    },
    setTooltipPosition: (position) => {
        set({ position });
    },
    setTooltipVisibility: (isVisible) => {
        set({ isVisible });
    },
}));
