import type { OperationErrorOptions } from "../shared/operationError";
import { OperationError } from "../shared/operationError";

export class ScriptLibraryError extends OperationError {
    constructor(options: OperationErrorOptions) {
        super("ScriptLibraryError", options);
    }
}
