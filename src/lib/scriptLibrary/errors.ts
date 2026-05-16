import { OperationError } from "../shared/operationError";
import type { OperationErrorOptions } from "../shared/operationError.type";

/**
 * Custom error type for script library operations.
 *
 * Extends OperationError to provide domain-specific error handling for
 * script library failures such as fetch errors or parsing failures.
 */
export class ScriptLibraryError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("ScriptLibraryError", options);
    }
}
