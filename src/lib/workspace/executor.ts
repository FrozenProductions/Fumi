import {
    MAX_EXECUTOR_PORT,
    MIN_EXECUTOR_PORT,
} from "../../constants/workspace/executor";

export function parseExecutorPort(port: string): number | null {
    const trimmedPort = port.trim();

    if (trimmedPort.length === 0) {
        return null;
    }

    const parsedPort = Number.parseInt(trimmedPort, 10);

    if (
        !Number.isInteger(parsedPort) ||
        parsedPort < MIN_EXECUTOR_PORT ||
        parsedPort > MAX_EXECUTOR_PORT
    ) {
        return null;
    }

    return parsedPort;
}

export function getExecutorPortRangeErrorMessage(): string {
    return `Port must be between ${MIN_EXECUTOR_PORT} and ${MAX_EXECUTOR_PORT}.`;
}
