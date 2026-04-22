import { getUnknownCauseMessage } from "../shared/errorMessage";
import { ScriptLibraryError } from "./errors";

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

export function createInvalidScriptLibraryResponseError(
    operation: string,
): ScriptLibraryError {
    return new ScriptLibraryError({
        operation,
        message: `Unexpected response shape for ${operation}.`,
    });
}
