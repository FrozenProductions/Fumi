import {
    APP_ZOOM_DEFAULT,
    APP_ZOOM_MAX,
    APP_ZOOM_MIN,
} from "../../constants/app/settings";
import { useAppStore } from "./useAppStore";

function clampZoomPercent(zoomPercent: number): number {
    return Math.min(APP_ZOOM_MAX, Math.max(APP_ZOOM_MIN, zoomPercent));
}

export function useAppZoom(): {
    zoomPercent: number;
    setZoomPercent: (zoomPercent: number) => void;
} {
    const zoomPercent = useAppStore((state) => state.zoomPercent);
    const setStoredZoomPercent = useAppStore((state) => state.setZoomPercent);

    const setZoomPercent = (nextZoomPercent: number): void => {
        const normalizedZoomPercent = clampZoomPercent(nextZoomPercent);
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
