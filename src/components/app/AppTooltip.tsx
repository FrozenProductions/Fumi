import {
    cloneElement,
    type FocusEvent,
    type MutableRefObject,
    type PointerEvent,
    type ReactElement,
    type ReactNode,
    type Ref,
    useEffect,
    useId,
    useRef,
} from "react";
import {
    DEFAULT_TOOLTIP_DELAY_MS,
    DEFAULT_TOOLTIP_OFFSET,
    TOOLTIP_WARM_RESET_DELAY_MS,
} from "../../constants/tooltip/tooltip";
import {
    selectActiveTooltipId,
    useTooltipStore,
} from "../../hooks/tooltip/useTooltipStore";
import type { TooltipSide } from "../../types/tooltip/tooltip";

let isGlobalWarm = false;
let globalWarmTimer: number | null = null;

function setGlobalWarm() {
    isGlobalWarm = true;
    if (globalWarmTimer !== null) {
        window.clearTimeout(globalWarmTimer);
        globalWarmTimer = null;
    }
}

function setGlobalCold() {
    if (globalWarmTimer !== null) {
        window.clearTimeout(globalWarmTimer);
    }
    globalWarmTimer = window.setTimeout(() => {
        isGlobalWarm = false;
    }, TOOLTIP_WARM_RESET_DELAY_MS);
}

type AppTooltipProps = {
    children: ReactElement<TooltipTriggerProps>;
    content: ReactNode;
    shortcut?: ReactNode;
    side?: TooltipSide;
    offset?: number;
    delayMs?: number;
    disabled?: boolean;
};

type TooltipTriggerProps = {
    "aria-describedby"?: string;
    onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
    onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
    onFocus?: (event: FocusEvent<HTMLElement>) => void;
    onBlur?: (event: FocusEvent<HTMLElement>) => void;
    onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
    ref?: Ref<HTMLElement>;
};

function isMutableRefObject<T>(ref: Ref<T>): ref is MutableRefObject<T | null> {
    return typeof ref === "object" && ref !== null && "current" in ref;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
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

function mergeDescribedBy(
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

export function AppTooltip({
    children,
    content,
    shortcut,
    side = "top",
    offset = DEFAULT_TOOLTIP_OFFSET,
    delayMs = DEFAULT_TOOLTIP_DELAY_MS,
    disabled = false,
}: AppTooltipProps): ReactElement {
    const activeTooltipId = useTooltipStore(selectActiveTooltipId);
    const hideTooltip = useTooltipStore((state) => state.hideTooltip);
    const showTooltip = useTooltipStore((state) => state.showTooltip);
    const tooltipId = useId();
    const openTimerRef = useRef<number | null>(null);
    const triggerElementRef = useRef<HTMLElement | null>(null);
    const childElement = children;
    const isVisible = !disabled && activeTooltipId === tooltipId;

    const clearOpenTimer = (): void => {
        if (openTimerRef.current === null) {
            return;
        }

        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
    };

    const openTooltip = (useDelay: boolean): void => {
        if (disabled || !triggerElementRef.current) {
            return;
        }

        clearOpenTimer();

        const show = (): void => {
            if (!triggerElementRef.current) {
                return;
            }

            setGlobalWarm();

            showTooltip({
                id: tooltipId,
                content,
                shortcut,
                side,
                offset,
                triggerElement: triggerElementRef.current,
            });
        };

        if (!useDelay || isGlobalWarm) {
            show();
            return;
        }

        openTimerRef.current = window.setTimeout(() => {
            show();
            openTimerRef.current = null;
        }, delayMs);
    };

    const closeTooltip = (): void => {
        clearOpenTimer();
        hideTooltip(tooltipId);
        setGlobalCold();
    };

    useEffect(() => {
        return () => {
            if (openTimerRef.current !== null) {
                window.clearTimeout(openTimerRef.current);
            }

            hideTooltip(tooltipId);
        };
    }, [hideTooltip, tooltipId]);

    useEffect(() => {
        if (!disabled || activeTooltipId !== tooltipId) {
            return;
        }

        hideTooltip(tooltipId);
    }, [activeTooltipId, disabled, hideTooltip, tooltipId]);

    useEffect(() => {
        if (!isVisible || !triggerElementRef.current) {
            return;
        }

        showTooltip({
            id: tooltipId,
            content,
            shortcut,
            side,
            offset,
            triggerElement: triggerElementRef.current,
        });
    }, [content, shortcut, isVisible, offset, showTooltip, side, tooltipId]);

    if (disabled) {
        return children;
    }

    return cloneElement(childElement, {
        ref: (node: HTMLElement | null) => {
            triggerElementRef.current = node;
            assignRef(childElement.props.ref, node);
        },
        "aria-describedby": mergeDescribedBy(
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
