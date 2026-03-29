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
