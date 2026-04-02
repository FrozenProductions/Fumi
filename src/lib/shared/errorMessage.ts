type ErrorMessageOptions = {
    useFallbackForAbort?: boolean;
};

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
