import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
    EXECUTOR_MESSAGE_EVENT,
    EXECUTOR_STATUS_CHANGED_EVENT,
} from "../../constants/platform/platform";
import {
    DEFAULT_EXECUTOR_KIND,
    DEFAULT_EXECUTOR_PORT,
    getExecutorPorts,
} from "../../constants/workspace/executor";
import type {
    ExecutorMessagePayload,
    ExecutorPortSummary,
    ExecutorStatusPayload,
} from "../../lib/workspace/workspace.type";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { isBoolean, isNumber, isRecord, isString } from "../shared/validation";
import { ExecutorCommandError } from "./errors";
import { isTauriEnvironment } from "./runtime";

function createDefaultExecutorPortSummaries(): readonly ExecutorPortSummary[] {
    return getExecutorPorts(DEFAULT_EXECUTOR_KIND).map((port) => ({
        port,
        boundAccountId: null,
        boundAccountDisplayName: null,
        isBoundToUnknownAccount: false,
    }));
}

const DEFAULT_EXECUTOR_STATUS: ExecutorStatusPayload = {
    executorKind: DEFAULT_EXECUTOR_KIND,
    availablePorts: createDefaultExecutorPortSummaries(),
    port: DEFAULT_EXECUTOR_PORT,
    isAttached: false,
};

const DESKTOP_SHELL_REQUIRED_ERROR =
    "Executor commands require the Tauri desktop shell.";

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

function createInvalidExecutorResponseError(
    operation: string,
): ExecutorCommandError {
    return new ExecutorCommandError({
        operation,
        message: `Unexpected response shape for ${operation}.`,
    });
}

function parseExecutorStatusPayload(
    value: unknown,
    operation: string,
): ExecutorStatusPayload {
    if (!isRecord(value) || !Array.isArray(value.availablePorts)) {
        throw createInvalidExecutorResponseError(operation);
    }

    if (
        (value.executorKind !== "macsploit" &&
            value.executorKind !== "opiumware" &&
            value.executorKind !== "unsupported") ||
        !value.availablePorts.every((portSummary) =>
            isExecutorPortSummary(portSummary),
        ) ||
        !isNumber(value.port) ||
        !isBoolean(value.isAttached)
    ) {
        throw createInvalidExecutorResponseError(operation);
    }

    return {
        executorKind: value.executorKind,
        availablePorts: value.availablePorts,
        port: value.port,
        isAttached: value.isAttached,
    };
}

function isExecutorPortSummary(value: unknown): value is ExecutorPortSummary {
    return (
        isRecord(value) &&
        isNumber(value.port) &&
        (value.boundAccountId === null || isString(value.boundAccountId)) &&
        (value.boundAccountDisplayName === null ||
            isString(value.boundAccountDisplayName)) &&
        isBoolean(value.isBoundToUnknownAccount)
    );
}

async function invokeExecutorCommand<T>(
    command: string,
    operation: string,
    parseValue: (value: unknown, parseOperation: string) => T,
    args?: Record<string, unknown>,
): Promise<T> {
    try {
        const value = await invoke<unknown>(command, args);
        return parseValue(value, operation);
    } catch (error) {
        if (error instanceof ExecutorCommandError) {
            throw error;
        }

        throw createExecutorCommandError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

/**
 * Gets the current executor status including available ports and attachment state.
 *
 * @returns The current executor status payload
 */
export function getExecutorStatus(): Promise<ExecutorStatusPayload> {
    if (!isTauriEnvironment()) {
        return Promise.resolve(DEFAULT_EXECUTOR_STATUS);
    }

    return invokeExecutorCommand(
        "get_executor_status",
        "getExecutorStatus",
        parseExecutorStatusPayload,
    );
}

/**
 * Attaches the executor to a specific port for script execution.
 *
 * @param port - The port number to attach to
 * @returns Updated executor status with port binding info
 */
export function attachExecutor(port: number): Promise<ExecutorStatusPayload> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new ExecutorCommandError({
                operation: "attachExecutor",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeExecutorCommand(
        "attach_executor",
        "attachExecutor",
        parseExecutorStatusPayload,
        {
            port,
        },
    );
}

/**
 * Detaches the executor from the current port.
 *
 * @returns Updated executor status showing detached state
 */
export function detachExecutor(): Promise<ExecutorStatusPayload> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new ExecutorCommandError({
                operation: "detachExecutor",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeExecutorCommand(
        "detach_executor",
        "detachExecutor",
        parseExecutorStatusPayload,
    );
}

/**
 * Executes a Luau script string via the attached executor.
 *
 * @param script - The Luau script source to execute
 */
export function executeExecutorScript(script: string): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new ExecutorCommandError({
                operation: "executeExecutorScript",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invoke<void>("execute_executor_script", {
        script,
    }).catch((error) => {
        throw createExecutorCommandError(
            "executeExecutorScript",
            error,
            "Could not execute the active script.",
        );
    });
}

/**
 * Subscribes to executor messages (stdout/stderr from executed scripts).
 *
 * @param listener - Callback invoked with each executor message payload
 * @returns Unsubscribe function
 */
export function subscribeToExecutorMessages(
    listener: (payload: ExecutorMessagePayload) => void,
): Promise<() => void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve(() => undefined);
    }

    return listen<ExecutorMessagePayload>(EXECUTOR_MESSAGE_EVENT, (event) => {
        listener(event.payload);
    }).catch((error) => {
        throw createExecutorCommandError(
            "subscribeToExecutorMessages",
            error,
            "Could not subscribe to executor messages.",
        );
    });
}

/**
 * Subscribes to executor status changes (attach/detach events).
 *
 * @param listener - Callback invoked with updated executor status
 * @returns Unsubscribe function
 */
export function subscribeToExecutorStatusChanged(
    listener: (payload: ExecutorStatusPayload) => void,
): Promise<() => void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve(() => undefined);
    }

    return listen<ExecutorStatusPayload>(
        EXECUTOR_STATUS_CHANGED_EVENT,
        (event) => {
            listener(event.payload);
        },
    ).catch((error) => {
        throw createExecutorCommandError(
            "subscribeToExecutorStatusChanged",
            error,
            "Could not subscribe to executor status changes.",
        );
    });
}
