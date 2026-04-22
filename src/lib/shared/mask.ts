import type { CSSProperties } from "react";

export function createMaskStyle(assetUrl: string): CSSProperties {
    const maskValue = `url("${assetUrl}") center / contain no-repeat`;

    return {
        mask: maskValue,
        WebkitMask: maskValue,
    };
}
