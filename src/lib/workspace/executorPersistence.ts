import { Schema } from "effect";
import {
    MACSPLOIT_EXECUTOR_PORTS,
    OPIUMWARE_EXECUTOR_PORTS,
} from "../../constants/workspace/executor";
import type { ExecutorKind } from "./workspace.type";

const EXECUTOR_PORTS_STORAGE_KEY = "fumi-executor-ports";

type PersistedExecutorPorts = {
    macsploit: number;
    opiumware: number;
};

const PersistedExecutorPortsSchema = Schema.Struct({
    macsploit: Schema.Number,
    opiumware: Schema.Number,
});

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
    const decodeResult = Schema.decodeUnknownEither(
        PersistedExecutorPortsSchema,
    )(value);

    return decodeResult._tag === "Right" ? decodeResult.right : null;
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
    availablePorts: readonly number[];
    fallbackPort: number;
}): number {
    const { executorKind, availablePorts, fallbackPort } = options;

    if (availablePorts.includes(fallbackPort)) {
        if (executorKind === "unsupported") {
            return fallbackPort;
        }

        const persistedPort = readPersistedExecutorPorts()[executorKind];
        return availablePorts.includes(persistedPort)
            ? persistedPort
            : fallbackPort;
    }

    return availablePorts[0] ?? fallbackPort;
}
