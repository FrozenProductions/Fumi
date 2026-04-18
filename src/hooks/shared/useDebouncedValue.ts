import { useEffect, useState } from "react";

/**
 * Creates a debounced copy of a value that updates after the delay elapses.
 *
 * @remarks
 * Useful for delaying search input processing to avoid excessive operations.
 * The timeout is cleared and restarted whenever the value or delay changes.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [delay, value]);

    return debouncedValue;
}
