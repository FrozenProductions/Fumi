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
