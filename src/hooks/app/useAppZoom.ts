import { APP_ZOOM_DEFAULT } from "../../constants/app/settings";
import { clampAppZoomPercent } from "../../lib/app/store";
import { useAppStore } from "./useAppStore";

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
