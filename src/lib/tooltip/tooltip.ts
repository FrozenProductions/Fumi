import type { MutableRefObject, Ref } from "react";
import { TOOLTIP_WARM_RESET_DELAY_MS } from "../../constants/tooltip/tooltip";

let isTooltipWarm = false;
let tooltipWarmTimer: number | null = null;

export function markTooltipWarm(): void {
    isTooltipWarm = true;

    if (tooltipWarmTimer !== null) {
        window.clearTimeout(tooltipWarmTimer);
        tooltipWarmTimer = null;
    }
}

export function scheduleTooltipCooldown(): void {
    if (tooltipWarmTimer !== null) {
        window.clearTimeout(tooltipWarmTimer);
    }

    tooltipWarmTimer = window.setTimeout(() => {
        isTooltipWarm = false;
    }, TOOLTIP_WARM_RESET_DELAY_MS);
}

export function shouldSkipTooltipDelay(): boolean {
    return isTooltipWarm;
}

function isMutableRefObject<T>(ref: Ref<T>): ref is MutableRefObject<T | null> {
    return typeof ref === "object" && ref !== null && "current" in ref;
}

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
