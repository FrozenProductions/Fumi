import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
    DEFAULT_EXECUTOR_KIND,
    DEFAULT_EXECUTOR_PORT,
    getExecutorPorts,
} from "../../constants/workspace/executor";
import type {
    ExecutorMessagePayload,
    ExecutorStatusPayload,
} from "../../lib/workspace/workspace.type";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { isBoolean, isNumber, isRecord } from "../shared/validation";
import { ExecutorCommandError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const EXECUTOR_MESSAGE_EVENT = "executor://message";
const EXECUTOR_STATUS_CHANGED_EVENT = "executor://status-changed";

const DEFAULT_EXECUTOR_STATUS: ExecutorStatusPayload = {
    executorKind: DEFAULT_EXECUTOR_KIND,
    availablePorts: [...getExecutorPorts(DEFAULT_EXECUTOR_KIND)],
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
        !value.availablePorts.every((port) => isNumber(port)) ||
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
