import { Effect, Fiber } from "effect";

export function runSync<A, E>(effect: Effect.Effect<A, E, never>): A {
    return Effect.runSync(effect);
}

export function runPromise<A, E>(
    effect: Effect.Effect<A, E, never>,
): Promise<A> {
    return Effect.runPromise(effect);
}

export function runFork<A, E>(
    effect: Effect.Effect<A, E, never>,
): Fiber.RuntimeFiber<A, E> {
    return Effect.runFork(effect);
}

export function interruptFiber(
    fiber: Fiber.Fiber<unknown, unknown>,
): Promise<void> {
    return Effect.runPromise(Fiber.interruptFork(fiber));
}
