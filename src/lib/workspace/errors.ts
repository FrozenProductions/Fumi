import {
    OperationError,
    type OperationErrorOptions,
} from "../shared/operationError";

export class PersistenceError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("PersistenceError", options);
    }
}
