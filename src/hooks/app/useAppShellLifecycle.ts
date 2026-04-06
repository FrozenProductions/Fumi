import { useEffect, useEffectEvent } from "react";
import {
    isPreparingToExit,
    subscribeToCheckForUpdatesRequested,
    subscribeToOpenSettings,
} from "../../lib/platform/window";
import type { UseAppShellLifecycleOptions } from "./useAppShellLifecycle.type";

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
