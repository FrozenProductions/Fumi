import { getUnknownCauseMessage } from "../shared/errorMessage";
import { WindowShellError } from "./errors";

/**
 * Creates a {@link WindowShellError} from an unknown error, using a fallback message
 * when the cause cannot be determined.
 *
 * @param operation - Name of the failing window operation
 * @param error - The original error thrown by the Tauri window API
 * @param fallbackMessage - Message to use when the error cause is unknown
 * @returns A typed window shell error
 */
export function createWindowShellError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): WindowShellError {
    return new WindowShellError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}
