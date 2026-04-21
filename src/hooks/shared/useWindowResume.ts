import { useEffect, useRef } from "react";
import { subscribeToWindowResume } from "../../lib/shared/windowResume";

type UseWindowResumeOptions = {
    isEnabled?: boolean;
    triggerOnMount?: boolean;
};

/**
 * Subscribes to a shared app-resume signal triggered by focus and visibility recovery.
 *
 * @remarks
 * Uses a shared window-level coordinator so multiple consumers do not install duplicate
 * focus and visibility listeners or duplicate debounce timers.
 */
export function useWindowResume(
    listener: () => void,
    options: UseWindowResumeOptions = {},
): void {
    const { isEnabled = true, triggerOnMount = false } = options;
    const listenerRef = useRef(listener);

    listenerRef.current = listener;

    useEffect(() => {
        if (!isEnabled) {
            return;
        }

        if (triggerOnMount) {
            listenerRef.current();
        }

        return subscribeToWindowResume(() => {
            listenerRef.current();
        });
    }, [isEnabled, triggerOnMount]);
}
