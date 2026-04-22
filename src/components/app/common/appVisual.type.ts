import type { HugeiconsProps } from "@hugeicons/react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import type { AppIconGlyph } from "../../../lib/app/app.type";

export type AppAnimatedTextProps = {
    text: string;
    animateOnInitialRender?: boolean;
};

export type AnimatedCharacter = {
    character: string;
    delayMs: number;
    key: string;
};

export type AppIconProps = Omit<HugeiconsProps, "icon"> & {
    icon: AppIconGlyph;
};

export type AppIconButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-label" | "children"
> & {
    ariaLabel: string;
    children: ReactNode;
    isActive?: boolean;
};

export type TrafficLightTone = "close" | "minimize" | "maximize";

export type TrafficLightButtonProps = {
    glyph: ReactElement;
    label: string;
    onClick: () => void;
    tone: TrafficLightTone;
    isActive?: boolean;
};

export type MaximizeGlyphProps = {
    isWindowMaximized: boolean;
};
