import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { DEFAULT_EXECUTOR_PORT } from "../../constants/workspace/executor";
import type {
    ExecutorMessagePayload,
    ExecutorStatusPayload,
} from "../../types/workspace/executor";
import { isTauriEnvironment } from "./runtime";

const EXECUTOR_MESSAGE_EVENT = "executor://message";
const EXECUTOR_STATUS_CHANGED_EVENT = "executor://status-changed";

const DEFAULT_EXECUTOR_STATUS: ExecutorStatusPayload = {
    port: DEFAULT_EXECUTOR_PORT,
    isAttached: false,
};

const DESKTOP_SHELL_REQUIRED_ERROR =
    "Executor commands require the Tauri desktop shell.";

export function getExecutorStatus(): Promise<ExecutorStatusPayload> {
    if (!isTauriEnvironment()) {
        return Promise.resolve(DEFAULT_EXECUTOR_STATUS);
    }

    return invoke<ExecutorStatusPayload>("get_executor_status");
}

export function attachExecutor(port: number): Promise<ExecutorStatusPayload> {
    if (!isTauriEnvironment()) {
        return Promise.reject(new Error(DESKTOP_SHELL_REQUIRED_ERROR));
    }

    return invoke<ExecutorStatusPayload>("attach_executor", {
        port,
    });
}

export function detachExecutor(): Promise<ExecutorStatusPayload> {
    if (!isTauriEnvironment()) {
        return Promise.reject(new Error(DESKTOP_SHELL_REQUIRED_ERROR));
    }

    return invoke<ExecutorStatusPayload>("detach_executor");
}

export function executeExecutorScript(script: string): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(new Error(DESKTOP_SHELL_REQUIRED_ERROR));
    }

    return invoke<void>("execute_executor_script", {
        script,
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
    );
}
