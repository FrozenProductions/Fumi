import { useEffect, useRef, useState } from "react";
import type {
    UsePresenceTransitionOptions,
    UsePresenceTransitionResult,
} from "./usePresenceTransition.type";

export function usePresenceTransition({
    isOpen,
    exitDurationMs,
}: UsePresenceTransitionOptions): UsePresenceTransitionResult {
    const [isPresent, setIsPresent] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);
    const closeTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (closeTimeoutRef.current !== null) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        if (isOpen) {
            setIsPresent(true);
            setIsClosing(false);
            return;
        }

        if (!isPresent) {
            return;
        }

        setIsClosing(true);
        closeTimeoutRef.current = window.setTimeout(() => {
            setIsPresent(false);
            setIsClosing(false);
            closeTimeoutRef.current = null;
        }, exitDurationMs);
    }, [exitDurationMs, isOpen, isPresent]);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current !== null) {
                window.clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return {
        isPresent,
        isClosing,
    };
}
