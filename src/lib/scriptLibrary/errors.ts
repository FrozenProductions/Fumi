import { Schema } from "effect";

export class ScriptLibraryError extends Schema.TaggedError<ScriptLibraryError>()(
    "ScriptLibraryError",
    {
        operation: Schema.String,
        message: Schema.String,
    },
) {}
