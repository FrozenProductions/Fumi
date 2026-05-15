import { APP_ZOOM_DEFAULT } from "../../constants/app/settings";
import { clampAppZoomPercent } from "../../lib/app/store";
import { useAppStore } from "./useAppStore";

type AppZoomPercentUpdate = number | ((currentZoomPercent: number) => number);

/**
 * Provides normalized zoom control backed by persistent app state.
 *
 * @remarks
 * Clamps zoom values to valid range (50-200%) and resets to default on invalid input.
 */
export function useAppZoom(): {
    zoomPercent: number;
    setZoomPercent: (zoomPercent: AppZoomPercentUpdate) => void;
} {
    const zoomPercent = useAppStore((state) => state.zoomPercent);
    const setStoredZoomPercent = useAppStore((state) => state.setZoomPercent);

    const setZoomPercent = (nextZoomPercent: AppZoomPercentUpdate): void => {
        const resolvedZoomPercent =
            typeof nextZoomPercent === "function"
                ? nextZoomPercent(useAppStore.getState().zoomPercent)
                : nextZoomPercent;
        const normalizedZoomPercent = clampAppZoomPercent(resolvedZoomPercent);
        setStoredZoomPercent(
            Number.isFinite(normalizedZoomPercent)
                ? normalizedZoomPercent
                : APP_ZOOM_DEFAULT,
        );
    };

    return {
        zoomPercent,
        setZoomPercent,
    };
}
