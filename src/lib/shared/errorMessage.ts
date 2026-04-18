import type { ErrorMessageOptions } from "./errorMessage.type";

/**
 * Extracts a user-friendly error message from an unknown error value.
 *
 * @remarks
 * Prefers the error's message property when available. Supports optional
 * handling of AbortError as a fallback message when configured.
 */
export function getErrorMessage(
    error: unknown,
    fallbackMessage: string,
    options?: ErrorMessageOptions,
): string {
    if (
        options?.useFallbackForAbort &&
        error instanceof Error &&
        error.name === "AbortError"
    ) {
        return fallbackMessage;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
}

export function getUnknownCauseMessage(
    error: unknown,
    fallbackMessage: string,
): string {
    if (typeof error === "string" && error.trim().length > 0) {
        return error;
    }

    return getErrorMessage(error, fallbackMessage);
}
