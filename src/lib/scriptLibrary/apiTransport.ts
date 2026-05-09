import { createScriptLibraryError } from "./apiErrors";
import { ScriptLibraryError } from "./errors";

async function fetchResponse(
    url: string,
    operation: string,
    options?: {
        signal?: AbortSignal;
    },
): Promise<Response> {
    try {
        return await fetch(url, { signal: options?.signal });
    } catch (error) {
        throw createScriptLibraryError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

/**
 * Fetches a URL, validates the response, parses JSON, and passes it through a typed parser.
 *
 * @param url - The URL to fetch
 * @param operation - Operation name for error context
 * @param parseValue - Function that validates and transforms the raw JSON value
 * @param options - Optional abort signal for cancellation
 * @returns The parsed and typed result
 * @throws {ScriptLibraryError} If the fetch fails, response is not OK, or JSON is invalid
 */
export async function fetchJsonResponse<T>(
    url: string,
    operation: string,
    parseValue: (value: unknown, parseOperation: string) => T,
    options?: {
        signal?: AbortSignal;
    },
): Promise<T> {
    const response = await fetchResponse(url, operation, options);

    if (!response.ok) {
        throw new ScriptLibraryError({
            operation,
            message: `${operation} failed with status ${response.status}.`,
        });
    }

    let value: unknown;

    try {
        value = await response.json();
    } catch (error) {
        throw createScriptLibraryError(
            operation,
            error,
            `Could not decode ${operation} JSON.`,
        );
    }

    return parseValue(value, operation);
}

/**
 * Fetches a URL and returns the response body as plain text.
 *
 * @param url - The URL to fetch
 * @param operation - Operation name for error context
 * @param options - Optional abort signal for cancellation
 * @returns The response body as a string
 * @throws {ScriptLibraryError} If the fetch fails, response is not OK, or text read fails
 */
export async function fetchTextResponse(
    url: string,
    operation: string,
    options?: {
        signal?: AbortSignal;
    },
): Promise<string> {
    const response = await fetchResponse(url, operation, options);

    if (!response.ok) {
        throw new ScriptLibraryError({
            operation,
            message: `${operation} failed with status ${response.status}.`,
        });
    }

    try {
        return await response.text();
    } catch (error) {
        throw createScriptLibraryError(
            operation,
            error,
            `Could not read ${operation} text.`,
        );
    }
}
