import { useEffect } from "react";
import { APP_ZOOM_DEFAULT, APP_ZOOM_STEP } from "../../constants/app/settings";
import {
    subscribeToZoomInRequested,
    subscribeToZoomOutRequested,
    subscribeToZoomResetRequested,
} from "../../lib/platform/window";
import { useAppStore } from "./useAppStore";

export function useAppZoomSync(): void {
    const zoomPercent = useAppStore((state) => state.zoomPercent);

    useEffect(() => {
        document.documentElement.style.zoom = `${zoomPercent / 100}`;

        return () => {
            document.documentElement.style.zoom = "1";
        };
    }, [zoomPercent]);

    useEffect(() => {
        const handleZoomIn = (): void => {
            const { zoomPercent: currentZoomPercent, setZoomPercent } =
                useAppStore.getState();
            setZoomPercent(currentZoomPercent + APP_ZOOM_STEP);
        };
        const handleZoomOut = (): void => {
            const { zoomPercent: currentZoomPercent, setZoomPercent } =
                useAppStore.getState();
            setZoomPercent(currentZoomPercent - APP_ZOOM_STEP);
        };
        const handleZoomReset = (): void => {
            useAppStore.getState().setZoomPercent(APP_ZOOM_DEFAULT);
        };

        const unsubscribeZoomIn = subscribeToZoomInRequested(handleZoomIn);
        const unsubscribeZoomOut = subscribeToZoomOutRequested(handleZoomOut);
        const unsubscribeZoomReset =
            subscribeToZoomResetRequested(handleZoomReset);

        return () => {
            unsubscribeZoomIn();
            unsubscribeZoomOut();
            unsubscribeZoomReset();
        };
    }, []);
}
