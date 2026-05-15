import { useEffect, useReducer, useRef } from "react";
import type {
    PresenceTransitionState,
    UsePresenceTransitionOptions,
    UsePresenceTransitionResult,
} from "./usePresenceTransition.type";

/**
 * Manages presence lifecycle for animatable overlay elements.
 *
 * @remarks
 * Keeps elements present during exit animations by delaying the `isPresent`
 * state change until the exit duration completes, enabling fade-out animations.
 */
export function usePresenceTransition({
    isOpen,
    exitDurationMs,
}: UsePresenceTransitionOptions): UsePresenceTransitionResult {
    const [state, dispatchTransitionState] = useReducer(
        (
            currentState: PresenceTransitionState,
            nextState: Partial<PresenceTransitionState>,
        ): PresenceTransitionState => ({
            ...currentState,
            ...nextState,
        }),
        {
            isPresent: isOpen,
            isClosing: false,
        },
    );
    const closeTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (closeTimeoutRef.current !== null) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        if (isOpen) {
            dispatchTransitionState({
                isPresent: true,
                isClosing: false,
            });
            return;
        }

        if (!state.isPresent) {
            return;
        }

        dispatchTransitionState({ isClosing: true });
        closeTimeoutRef.current = window.setTimeout(() => {
            dispatchTransitionState({
                isPresent: false,
                isClosing: false,
            });
            closeTimeoutRef.current = null;
        }, exitDurationMs);
    }, [exitDurationMs, isOpen, state.isPresent]);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current !== null) {
                window.clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return state;
}
