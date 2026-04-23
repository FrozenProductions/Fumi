import type { CSSProperties } from "react";

/**
 * Creates a CSS mask style object for an SVG asset URL with vendor-prefixed properties.
 */
export function createMaskStyle(assetUrl: string): CSSProperties {
    const maskValue = `url("${assetUrl}") center / contain no-repeat`;

    return {
        mask: maskValue,
        WebkitMask: maskValue,
    };
}
