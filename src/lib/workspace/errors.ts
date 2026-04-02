import { Schema } from "effect";

export class PersistenceError extends Schema.TaggedError<PersistenceError>()(
    "PersistenceError",
    {
        operation: Schema.String,
        message: Schema.String,
    },
) {}
