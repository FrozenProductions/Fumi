import type { CSSProperties, ReactElement } from "react";
import { useEffect, useState } from "react";
import {
    closeCurrentWindow,
    minimizeCurrentWindow,
    readCurrentWindowMaximizedState,
    subscribeToCurrentWindowResize,
    toggleCurrentWindowMaximize,
} from "../../lib/platform/window";
import { AppTooltip } from "./AppTooltip";
import type {
    MaximizeGlyphProps,
    TrafficLightButtonProps,
    TrafficLightTone,
} from "./appVisual.type";

const TRAFFIC_LIGHT_STYLE_MAP: Record<TrafficLightTone, CSSProperties> = {
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

function createWindowActionHandler(action: () => Promise<unknown>): () => void {
    return () => {
        void action();
    };
}

function AppTopbarTrafficLightButton({
    glyph,
    label,
    onClick,
    tone,
    isActive = false,
}: TrafficLightButtonProps): ReactElement {
    const buttonClassName = [
        "group relative inline-flex size-3 items-center justify-center rounded-full border border-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100",
        isActive ? "ring-1 ring-fumi-900/20" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <AppTooltip content={label} side="bottom">
            <button
                type="button"
                aria-label={label}
                data-topbar-interactive="true"
                className={buttonClassName}
                style={TRAFFIC_LIGHT_STYLE_MAP[tone]}
                onClick={onClick}
            >
                {glyph}
            </button>
        </AppTooltip>
    );
}

function CloseGlyph(): ReactElement {
    return (
        <span className="pointer-events-none relative block size-[6px] opacity-0 transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="absolute left-1/2 top-0 h-full w-[1.2px] -translate-x-1/2 rotate-45 rounded-full bg-black/50" />
            <span className="absolute left-1/2 top-0 h-full w-[1.2px] -translate-x-1/2 -rotate-45 rounded-full bg-black/50" />
        </span>
    );
}

function MinimizeGlyph(): ReactElement {
    return (
        <span className="pointer-events-none block h-[1.2px] w-[6px] rounded-full bg-black/50 opacity-0 transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100" />
    );
}

function MaximizeGlyph({
    isWindowMaximized,
}: MaximizeGlyphProps): ReactElement {
    if (isWindowMaximized) {
        return (
            <span className="pointer-events-none block size-[5px] rounded-[1px] border-[1.2px] border-black/50 opacity-0 transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100" />
        );
    }

    return (
        <span className="pointer-events-none relative block size-[6px] opacity-0 transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="absolute left-1/2 top-0 h-full w-[1.2px] -translate-x-1/2 rounded-full bg-black/50" />
            <span className="absolute left-0 top-1/2 h-[1.2px] w-full -translate-y-1/2 rounded-full bg-black/50" />
        </span>
    );
}

/**
 * macOS-style traffic light window controls for the topbar.
 *
 * Displays close, minimize, and maximize buttons with tooltips.
 *
 * @returns A React component
 */
export function AppTopbarTrafficLights(): ReactElement {
    const [isWindowMaximized, setIsWindowMaximized] = useState(false);

    useEffect(() => {
        let isDisposed = false;
        let unlistenResize: (() => void) | null = null;

        const syncWindowMaximizedState = async (): Promise<void> => {
            const nextMaximizedState = await readCurrentWindowMaximizedState();

            if (!isDisposed) {
                setIsWindowMaximized(nextMaximizedState);
            }
        };

        void syncWindowMaximizedState();

        void subscribeToCurrentWindowResize(() => {
            void syncWindowMaximizedState();
        }).then((unlisten) => {
            if (isDisposed) {
                unlisten();
                return;
            }

            unlistenResize = unlisten;
        });

        return () => {
            isDisposed = true;
            unlistenResize?.();
        };
    }, []);

    const handleMinimize = createWindowActionHandler(minimizeCurrentWindow);
    const handleClose = createWindowActionHandler(closeCurrentWindow);

    const handleToggleMaximize = (): void => {
        void toggleCurrentWindowMaximize().then((nextMaximizedState) => {
            setIsWindowMaximized(nextMaximizedState);
        });
    };

    return (
        <div className="pointer-events-auto absolute left-3 top-1/2 z-20 flex -translate-y-1/2 items-center gap-2">
            <AppTopbarTrafficLightButton
                label="Close window"
                tone="close"
                onClick={handleClose}
                glyph={<CloseGlyph />}
            />
            <AppTopbarTrafficLightButton
                label="Minimize window"
                tone="minimize"
                onClick={handleMinimize}
                glyph={<MinimizeGlyph />}
            />
            <AppTopbarTrafficLightButton
                label={
                    isWindowMaximized
                        ? "Restore window size"
                        : "Maximize window"
                }
                tone="maximize"
                onClick={handleToggleMaximize}
                isActive={isWindowMaximized}
                glyph={<MaximizeGlyph isWindowMaximized={isWindowMaximized} />}
            />
        </div>
    );
}
