import { APP_ZOOM_DEFAULT } from "../../../constants/app/settings";
import { clampAppZoomPercent } from "../../../lib/app/store";
import { useAppStore } from "../useAppStore";

/**
 * Provides normalized zoom control backed by persistent app state.
 *
 * @remarks
 * Clamps zoom values to valid range (50-200%) and resets to default on invalid input.
 */
export function useAppZoom(): {
    zoomPercent: number;
    setZoomPercent: (zoomPercent: number) => void;
} {
    const zoomPercent = useAppStore((state) => state.zoomPercent);
    const setStoredZoomPercent = useAppStore((state) => state.setZoomPercent);

    const setZoomPercent = (nextZoomPercent: number): void => {
        const normalizedZoomPercent = clampAppZoomPercent(nextZoomPercent);
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
