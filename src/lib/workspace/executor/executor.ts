import type { ExecutorPortSummary } from "../workspace.type";

/**
 * Extracts port numbers from executor port summaries.
 */
export function getExecutorPortsFromSummaries(
    availablePorts: readonly ExecutorPortSummary[],
): number[] {
    return availablePorts.map((item) => item.port);
}

/**
 * Parses a port string into a number, returning null if invalid or not in the available ports.
 */
export function parseExecutorPort(
    port: string,
    availablePorts: readonly number[],
): number | null {
    const trimmedPort = port.trim();

    if (trimmedPort.length === 0) {
        return null;
    }

    const parsedPort = Number.parseInt(trimmedPort, 10);

    if (!Number.isInteger(parsedPort) || !availablePorts.includes(parsedPort)) {
        return null;
    }

    return parsedPort;
}

/**
 * Normalizes a port string by falling back to the first available port when invalid.
 */
export function normalizeExecutorPort(
    port: string,
    availablePorts: readonly number[],
): string {
    if (availablePorts.length === 0) {
        return "";
    }

    const parsedPort = parseExecutorPort(port, availablePorts);

    return String(parsedPort ?? availablePorts[0]);
}

/**
 * Returns a human-readable error message for an invalid executor port selection.
 */
export function getExecutorPortRangeErrorMessage(
    availablePorts: readonly number[],
): string {
    if (availablePorts.length === 0) {
        return "No executor ports are available.";
    }

    if (availablePorts.length === 1) {
        return `Port must be ${availablePorts[0]}.`;
    }

    return `Port must be one of ${availablePorts.join(", ")}.`;
}
