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
