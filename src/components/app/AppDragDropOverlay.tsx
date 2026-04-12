import { FileUploadIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { AppIcon } from "./AppIcon";
import type { AppDragDropOverlayProps } from "./appDragDropOverlay.type";

export function AppDragDropOverlay({
    isVisible,
}: AppDragDropOverlayProps): ReactElement | null {
    if (!isVisible) {
        return null;
    }

    return (
        <div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-fumi-100/95 backdrop-blur-sm motion-preset-fade-sm motion-duration-200"
            role="presentation"
        >
            <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-fumi-300 bg-fumi-50 px-12 py-10 shadow-lg ring-1 ring-fumi-200">
                <AppIcon
                    icon={FileUploadIcon}
                    className="size-12 text-fumi-600"
                    strokeWidth={2.25}
                    aria-hidden="true"
                />
                <p className="text-sm font-semibold tracking-[0.02em] text-fumi-900">
                    Drop files to open
                </p>
            </div>
        </div>
    );
}
