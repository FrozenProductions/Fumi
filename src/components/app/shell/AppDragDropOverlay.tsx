import type { ReactElement } from "react";
import fileIcon from "../../../assets/icons/file.svg";
import { createMaskStyle } from "../../../lib/shared/mask";
import type { AppDragDropOverlayProps } from "./appDragDropOverlay.type";

const FILE_ICON_STYLE = createMaskStyle(fileIcon);

/**
 * Full-screen overlay displayed when dragging files over the app.
 *
 * @param props - Component props
 * @param props.isVisible - Whether the overlay is shown
 * @returns A React component or null
 */
export function AppDragDropOverlay({
    isVisible,
}: AppDragDropOverlayProps): ReactElement | null {
    if (!isVisible) {
        return null;
    }

    return (
        <div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-fumi-50/95 backdrop-blur-sm motion-safe:motion-opacity-in-0 motion-safe:motion-duration-150 motion-safe:motion-ease-out-cubic motion-reduce:animate-none"
            role="presentation"
        >
            <div className="mx-auto flex max-w-lg flex-col items-center text-center motion-safe:motion-opacity-in-0 motion-safe:-motion-translate-y-in-[8%] motion-safe:motion-scale-in-[97%] motion-safe:motion-duration-200 motion-safe:motion-delay-[40ms] motion-safe:motion-ease-spring-smooth motion-reduce:animate-none motion-reduce:transform-none">
                <div
                    aria-hidden="true"
                    className="mx-auto h-24 w-24 bg-fumi-600"
                    style={FILE_ICON_STYLE}
                />
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                    Drop to Open
                </p>
                <p className="mt-4 text-base leading-7 text-fumi-400">
                    Release to open your files in the workspace.
                </p>
            </div>
        </div>
    );
}
