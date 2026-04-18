import { useEffect, useEffectEvent } from "react";
import {
    isPreparingToExit,
    subscribeToCheckForUpdatesRequested,
    subscribeToOpenSettings,
} from "../../lib/platform/window";
import type { UseAppShellLifecycleOptions } from "./useAppShellLifecycle.type";

/**
 * Coordinates app shell lifecycle including beforeunload handling and settings navigation.
 *
 * @remarks
 * Prevents accidental navigation away when there are unsaved changes, and subscribes
 * to Tauri events for opening settings from menu or keyboard shortcuts.
 */
export function useAppShellLifecycle({
    hasUnsavedChanges,
    onOpenSettings,
}: UseAppShellLifecycleOptions): void {
    const handleOpenSettings = useEffectEvent(onOpenSettings);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
            if (!hasUnsavedChanges || isPreparingToExit()) {
                return;
            }

            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    useEffect(() => {
        return subscribeToOpenSettings(() => {
            handleOpenSettings();
        });
    }, []);

    useEffect(() => {
        return subscribeToCheckForUpdatesRequested(() => {
            handleOpenSettings();
        });
    }, []);
}
