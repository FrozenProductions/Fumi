import { getUnknownCauseMessage } from "../shared/errorMessage";
import { ScriptLibraryError } from "./errors";

/**
 * Creates a ScriptLibraryError from an unknown error cause, falling back to a default message.
 *
 * @param operation - The operation that failed (used for error context)
 * @param error - The underlying error
 * @param fallbackMessage - Message used when the cause cannot be extracted
 * @returns A ScriptLibraryError wrapping the cause
 */
export function createScriptLibraryError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): ScriptLibraryError {
    return new ScriptLibraryError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}

/**
 * Creates a ScriptLibraryError for an unexpected or malformed API response.
 *
 * @param operation - The operation that received the bad response
 * @returns A ScriptLibraryError describing the invalid response
 */
export function createInvalidScriptLibraryResponseError(
    operation: string,
): ScriptLibraryError {
    return new ScriptLibraryError({
        operation,
        message: `Unexpected response shape for ${operation}.`,
    });
}
