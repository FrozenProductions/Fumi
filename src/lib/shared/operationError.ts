export type OperationErrorOptions = {
    operation: string;
    message: string;
};

/**
 * Error class for failed workspace operations, carrying the operation name and message.
 */
export class OperationError extends Error {
    readonly operation: string;

    constructor(name: string, options: OperationErrorOptions) {
        super(options.message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = name;
        this.operation = options.operation;
    }
}
