import { getUnknownCauseMessage } from "../shared/errorMessage";
import { WindowShellError } from "./errors";

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
