import type { MutableRefObject, Ref } from "react";
import { TOOLTIP_WARM_RESET_DELAY_MS } from "../../constants/tooltip/tooltip";

let isTooltipWarm = false;
let tooltipWarmTimer: number | null = null;

/**
 * Marks the tooltip as "warm" so subsequent shows skip the enter delay.
 *
 * Cancels any pending cooldown timer so the warm state persists until explicitly cooled down.
 */
export function markTooltipWarm(): void {
    isTooltipWarm = true;

    if (tooltipWarmTimer !== null) {
        window.clearTimeout(tooltipWarmTimer);
        tooltipWarmTimer = null;
    }
}

/**
 * Schedules the tooltip warm state to reset after a fixed delay.
 *
 * Any previously scheduled cooldown is cancelled before the new timer starts.
 */
export function scheduleTooltipCooldown(): void {
    if (tooltipWarmTimer !== null) {
        window.clearTimeout(tooltipWarmTimer);
    }

    tooltipWarmTimer = window.setTimeout(() => {
        isTooltipWarm = false;
    }, TOOLTIP_WARM_RESET_DELAY_MS);
}

/**
 * Returns whether the tooltip is currently warm, meaning the enter delay should be skipped.
 *
 * @returns True if a tooltip was recently dismissed and the warm timer has not expired
 */
export function shouldSkipTooltipDelay(): boolean {
    return isTooltipWarm;
}

function isMutableRefObject<T>(ref: Ref<T>): ref is MutableRefObject<T | null> {
    return typeof ref === "object" && ref !== null && "current" in ref;
}

/**
 * Assigns a value to a React ref, handling both callback refs and mutable ref objects.
 *
 * @param ref - The React ref to assign to (undefined is silently ignored)
 * @param value - The value to set
 */
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
    if (!ref) {
        return;
    }

    if (typeof ref === "function") {
        ref(value);
        return;
    }

    if (isMutableRefObject(ref)) {
        ref.current = value;
    }
}

/**
 * Merges a tooltip ID into an existing aria-describedby attribute string.
 *
 * @param existingValue - Current aria-describedby value, if any
 * @param tooltipId - The tooltip element's ID to append
 * @param isVisible - Whether the tooltip is currently shown; if false, returns existingValue unchanged
 * @returns The merged aria-describedby string, or undefined when no tooltip is visible
 */
export function mergeAriaDescribedBy(
    existingValue: string | undefined,
    tooltipId: string,
    isVisible: boolean,
): string | undefined {
    if (!isVisible) {
        return existingValue;
    }

    if (!existingValue) {
        return tooltipId;
    }

    return `${existingValue} ${tooltipId}`;
}
