import type { OperationErrorOptions } from "../shared/operationError";
import { OperationError } from "../shared/operationError";

/**
 * Error thrown when a workspace persistence operation fails.
 */
export class PersistenceError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("PersistenceError", options);
    }
}
