import type { ExecutorKind } from "../../lib/workspace/workspace.type";

export const MACSPLOIT_EXECUTOR_PORTS = [
    5553, 5554, 5555, 5556, 5557, 5558, 5559, 5560, 5561, 5562,
] as const;
export const OPIUMWARE_EXECUTOR_PORTS = [
    8392, 8393, 8394, 8395, 8396, 8397,
] as const;
export const UNSUPPORTED_EXECUTOR_PORTS = [] as const;
export const DEFAULT_EXECUTOR_KIND: ExecutorKind = "macsploit";
export const DEFAULT_EXECUTOR_PORT = MACSPLOIT_EXECUTOR_PORTS[0];

export function getExecutorPorts(
    executorKind: ExecutorKind,
): readonly number[] {
    if (executorKind === "opiumware") {
        return OPIUMWARE_EXECUTOR_PORTS;
    }

    if (executorKind === "unsupported") {
        return UNSUPPORTED_EXECUTOR_PORTS;
    }

    return MACSPLOIT_EXECUTOR_PORTS;
}
