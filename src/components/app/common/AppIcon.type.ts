import type { HugeiconsProps } from "@hugeicons/react";
import type { AppIconGlyph } from "../../../lib/app/app.type";

export type AppIconProps = Omit<HugeiconsProps, "icon"> & {
    icon: AppIconGlyph;
};
