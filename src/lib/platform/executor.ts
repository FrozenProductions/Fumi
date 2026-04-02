import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Effect, Schema } from "effect";
import { DEFAULT_EXECUTOR_PORT } from "../../constants/workspace/executor";
import type {
    ExecutorMessagePayload,
    ExecutorStatusPayload,
} from "../../types/workspace/executor";
import { runPromise } from "../shared/effectRuntime";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { decodeUnknownWithSchema } from "../shared/schema";
import { ExecutorCommandError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const EXECUTOR_MESSAGE_EVENT = "executor://message";
const EXECUTOR_STATUS_CHANGED_EVENT = "executor://status-changed";

const DEFAULT_EXECUTOR_STATUS: ExecutorStatusPayload = {
    port: DEFAULT_EXECUTOR_PORT,
    isAttached: false,
};

const DESKTOP_SHELL_REQUIRED_ERROR =
    "Executor commands require the Tauri desktop shell.";

const ExecutorStatusPayloadSchema = Schema.Struct({
    port: Schema.Number,
    isAttached: Schema.Boolean,
});

function createExecutorCommandError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): ExecutorCommandError {
    return new ExecutorCommandError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}

function invokeExecutorCommandEffect<A, I>(
    command: string,
    schema: Schema.Schema<A, I, never>,
    operation: string,
    args?: Record<string, unknown>,
): Effect.Effect<A, ExecutorCommandError> {
    return Effect.tryPromise({
        try: () => invoke<unknown>(command, args),
        catch: (error) =>
            createExecutorCommandError(
                operation,
                error,
                `Could not complete ${operation}.`,
            ),
    }).pipe(
        Effect.flatMap((value) =>
            decodeUnknownWithSchema(
                schema,
                value,
                () =>
                    new ExecutorCommandError({
                        operation,
                        message: `Unexpected response shape for ${operation}.`,
                    }),
            ),
        ),
    );
}

export function getExecutorStatus(): Promise<ExecutorStatusPayload> {
    return runPromise(getExecutorStatusEffect());
}

export function getExecutorStatusEffect(): Effect.Effect<
    ExecutorStatusPayload,
    ExecutorCommandError
> {
    if (!isTauriEnvironment()) {
        return Effect.succeed(DEFAULT_EXECUTOR_STATUS);
    }

    return invokeExecutorCommandEffect(
        "get_executor_status",
        ExecutorStatusPayloadSchema,
        "getExecutorStatus",
    );
}

export function attachExecutor(port: number): Promise<ExecutorStatusPayload> {
    return runPromise(attachExecutorEffect(port));
}

export function attachExecutorEffect(
    port: number,
): Effect.Effect<ExecutorStatusPayload, ExecutorCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new ExecutorCommandError({
                operation: "attachExecutor",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeExecutorCommandEffect(
        "attach_executor",
        ExecutorStatusPayloadSchema,
        "attachExecutor",
        {
            port,
        },
    );
}

export function detachExecutor(): Promise<ExecutorStatusPayload> {
    return runPromise(detachExecutorEffect());
}

export function detachExecutorEffect(): Effect.Effect<
    ExecutorStatusPayload,
    ExecutorCommandError
> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new ExecutorCommandError({
                operation: "detachExecutor",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeExecutorCommandEffect(
        "detach_executor",
        ExecutorStatusPayloadSchema,
        "detachExecutor",
    );
}

export function executeExecutorScript(script: string): Promise<void> {
    return runPromise(executeExecutorScriptEffect(script));
}

export function executeExecutorScriptEffect(
    script: string,
): Effect.Effect<void, ExecutorCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new ExecutorCommandError({
                operation: "executeExecutorScript",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return Effect.tryPromise({
        try: () =>
            invoke<void>("execute_executor_script", {
                script,
            }),
        catch: (error) =>
            createExecutorCommandError(
                "executeExecutorScript",
                error,
                "Could not execute the active script.",
            ),
    });
}

export function subscribeToExecutorMessages(
    listener: (payload: ExecutorMessagePayload) => void,
): Promise<() => void> {
    return runPromise(subscribeToExecutorMessagesEffect(listener));
}

export function subscribeToExecutorMessagesEffect(
    listener: (payload: ExecutorMessagePayload) => void,
): Effect.Effect<() => void, ExecutorCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.succeed(() => undefined);
    }

    return Effect.tryPromise({
        try: () =>
            listen<ExecutorMessagePayload>(EXECUTOR_MESSAGE_EVENT, (event) => {
                listener(event.payload);
            }),
        catch: (error) =>
            createExecutorCommandError(
                "subscribeToExecutorMessages",
                error,
                "Could not subscribe to executor messages.",
            ),
    });
}

export function subscribeToExecutorStatusChanged(
    listener: (payload: ExecutorStatusPayload) => void,
): Promise<() => void> {
    return runPromise(subscribeToExecutorStatusChangedEffect(listener));
}

export function subscribeToExecutorStatusChangedEffect(
    listener: (payload: ExecutorStatusPayload) => void,
): Effect.Effect<() => void, ExecutorCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.succeed(() => undefined);
    }

    return Effect.tryPromise({
        try: () =>
            listen<ExecutorStatusPayload>(
                EXECUTOR_STATUS_CHANGED_EVENT,
                (event) => {
                    listener(event.payload);
                },
            ),
        catch: (error) =>
            createExecutorCommandError(
                "subscribeToExecutorStatusChanged",
                error,
                "Could not subscribe to executor status changes.",
            ),
    });
}
