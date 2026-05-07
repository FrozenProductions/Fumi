import { useEffect } from "react";
import { APP_ZOOM_DEFAULT, APP_ZOOM_STEP } from "../../constants/app/settings";
import {
    subscribeToZoomInRequested,
    subscribeToZoomOutRequested,
    subscribeToZoomResetRequested,
} from "../../lib/platform/window/window";
import { useAppStore } from "./useAppStore";

/**
 * Applies app zoom to the React surface and subscribes to zoom menu events.
 *
 * @remarks
 * Uses transform scaling with inverse layout dimensions so the app surface
 * fills the viewport at every zoom level. Cleans up the zoom styles on
 * unmount. Subscribes to Tauri zoom events for keyboard/menu zooming.
 */
export function useAppZoomSync(): void {
    const zoomPercent = useAppStore((state) => state.zoomPercent);

    useEffect(() => {
        const rootElement = document.getElementById("root");

        if (!rootElement) {
            return;
        }

        const zoomScale = zoomPercent / 100;
        rootElement.style.setProperty("--app-zoom-scale", String(zoomScale));
        rootElement.style.setProperty(
            "--app-zoom-inverse-scale",
            String(1 / zoomScale),
        );

        return () => {
            rootElement.style.removeProperty("--app-zoom-scale");
            rootElement.style.removeProperty("--app-zoom-inverse-scale");
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
