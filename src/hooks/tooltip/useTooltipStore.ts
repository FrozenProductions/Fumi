import { create } from "zustand";
import { INITIAL_TOOLTIP_POSITION } from "../../constants/tooltip/tooltip";
import type { TooltipStore } from "./useTooltipStore.type";

/**
 * Global tooltip state store managing visibility, positioning, and tooltip content.
 *
 * @remarks
 * Handles tooltip showing, hiding, and positioning with viewport margin constraints.
 * Tracks active tooltip definition and coordinates visibility with position updates.
 */
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
