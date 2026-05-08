import type { ReactElement } from "react";

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
