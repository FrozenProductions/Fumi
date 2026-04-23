import type { CSSProperties } from "react";
import type { TrafficLightTone } from "../../components/app/common/appVisual.type";

export const TOPBAR_INTERACTIVE_SELECTOR = [
    "button",
    "input",
    "select",
    "textarea",
    "a",
    "[role='button']",
    "[contenteditable='true']",
    "[data-topbar-interactive='true']",
].join(", ");
export const TRAFFIC_LIGHT_STYLE_MAP: Record<TrafficLightTone, CSSProperties> =
    {
        close: {
            backgroundColor: "rgb(var(--color-traffic-close) / 1)",
        },
        minimize: {
            backgroundColor: "rgb(var(--color-traffic-minimize) / 1)",
        },
        maximize: {
            backgroundColor: "rgb(var(--color-traffic-maximize) / 1)",
        },
    };
