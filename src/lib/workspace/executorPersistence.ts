import {
    MACSPLOIT_EXECUTOR_PORTS,
    OPIUMWARE_EXECUTOR_PORTS,
} from "../../constants/workspace/executor";
import { isNumber, isRecord } from "../shared/validation";
import { getExecutorPortsFromSummaries } from "./executor";
import type { PersistedExecutorPorts } from "./executorPersistence.type";
import type { ExecutorKind, ExecutorPortSummary } from "./workspace.type";

const EXECUTOR_PORTS_STORAGE_KEY = "fumi-executor-ports";

function createDefaultPersistedExecutorPorts(): PersistedExecutorPorts {
    return {
        macsploit: MACSPLOIT_EXECUTOR_PORTS[0],
        opiumware: OPIUMWARE_EXECUTOR_PORTS[0],
    };
}

function logExecutorPersistenceFailure(
    action: "read" | "write",
    error: unknown,
): void {
    console.warn(`Failed to ${action} executor ports.`, error);
}

function parsePersistedExecutorPorts(
    value: unknown,
): PersistedExecutorPorts | null {
    if (
        !isRecord(value) ||
        !isNumber(value.macsploit) ||
        !isNumber(value.opiumware)
    ) {
        return null;
    }

    return {
        macsploit: value.macsploit,
        opiumware: value.opiumware,
    };
}

function readPersistedExecutorPorts(): PersistedExecutorPorts {
    try {
        const storedValue =
            globalThis.localStorage?.getItem(EXECUTOR_PORTS_STORAGE_KEY) ??
            null;

        if (!storedValue) {
            return createDefaultPersistedExecutorPorts();
        }

        const parsedValue = JSON.parse(storedValue);
        const persistedPorts = parsePersistedExecutorPorts(parsedValue);

        if (persistedPorts) {
            return persistedPorts;
        }

        logExecutorPersistenceFailure(
            "read",
            new Error("Executor port storage has an invalid shape."),
        );
    } catch (error) {
        logExecutorPersistenceFailure("read", error);
    }

    return createDefaultPersistedExecutorPorts();
}

export function persistExecutorPort(
    executorKind: ExecutorKind,
    port: number,
): void {
    if (executorKind === "unsupported") {
        return;
    }

    const nextPorts = {
        ...readPersistedExecutorPorts(),
        [executorKind]: port,
    };

    try {
        globalThis.localStorage?.setItem(
            EXECUTOR_PORTS_STORAGE_KEY,
            JSON.stringify(nextPorts),
        );
    } catch (error) {
        logExecutorPersistenceFailure("write", error);
    }
}

export function resolvePersistedExecutorPort(options: {
    executorKind: ExecutorKind;
    availablePorts: readonly ExecutorPortSummary[];
    fallbackPort: number;
}): number {
    const { executorKind, availablePorts, fallbackPort } = options;
    const numericPorts = getExecutorPortsFromSummaries(availablePorts);

    if (numericPorts.includes(fallbackPort)) {
        if (executorKind === "unsupported") {
            return fallbackPort;
        }

        const persistedPort = readPersistedExecutorPorts()[executorKind];
        return numericPorts.includes(persistedPort)
            ? persistedPort
            : fallbackPort;
    }

    return numericPorts[0] ?? fallbackPort;
}
