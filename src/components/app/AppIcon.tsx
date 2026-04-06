import { HugeiconsIcon, type HugeiconsProps } from "@hugeicons/react";
import type { ReactElement } from "react";
import type { AppIconProps } from "./appVisual.type";

function normalizeStrokeWidth(
    size: HugeiconsProps["size"],
    strokeWidth: HugeiconsProps["strokeWidth"],
): HugeiconsProps["strokeWidth"] {
    if (strokeWidth === undefined) {
        return strokeWidth;
    }

    if (typeof size !== "number") {
        return strokeWidth * 0.75;
    }

    if (size <= 14) {
        return strokeWidth * 0.62;
    }

    if (size <= 18) {
        return strokeWidth * 0.72;
    }

    return strokeWidth * 0.8;
}

export function AppIcon({
    absoluteStrokeWidth = false,
    color = "currentColor",
    icon,
    size,
    strokeWidth,
    ...props
}: AppIconProps): ReactElement {
    return (
        <HugeiconsIcon
            absoluteStrokeWidth={absoluteStrokeWidth}
            color={color}
            icon={icon}
            size={size}
            strokeWidth={normalizeStrokeWidth(size, strokeWidth)}
            {...props}
        />
    );
}
