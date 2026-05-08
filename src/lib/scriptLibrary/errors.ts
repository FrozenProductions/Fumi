import { OperationError } from "../shared/operationError";
import type { OperationErrorOptions } from "../shared/operationError.type";

export class ScriptLibraryError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("ScriptLibraryError", options);
    }
}
