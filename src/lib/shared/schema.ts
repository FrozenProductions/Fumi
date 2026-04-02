import { Effect, Schema } from "effect";

export function decodeUnknownWithSchema<A, I, R, E>(
    schema: Schema.Schema<A, I, R>,
    value: unknown,
    onError: (error: unknown) => E,
): Effect.Effect<A, E, R> {
    return Schema.decodeUnknown(schema)(value).pipe(
        Effect.mapError((error) => onError(error)),
    );
}
