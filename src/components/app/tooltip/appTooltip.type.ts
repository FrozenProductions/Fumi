import type {
    FocusEvent,
    PointerEvent,
    ReactElement,
    ReactNode,
    Ref,
} from "react";
import type { TooltipSide } from "../../../lib/tooltip/tooltip.type";

export type AppTooltipProps = {
    children: ReactElement<TooltipTriggerProps>;
    content: ReactNode;
    shortcut?: ReactNode;
    side?: TooltipSide;
    offset?: number;
    delayMs?: number;
    disabled?: boolean;
};

export type TooltipTriggerProps = {
    "aria-describedby"?: string;
    onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
    onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
    onFocus?: (event: FocusEvent<HTMLElement>) => void;
    onBlur?: (event: FocusEvent<HTMLElement>) => void;
    onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
    ref?: Ref<HTMLElement>;
};

export type AppTooltipLayerProps = {
    id: string;
    content: ReactNode;
    shortcut?: ReactNode;
    side: TooltipSide;
    top: number;
    left: number;
    isVisible: boolean;
};
