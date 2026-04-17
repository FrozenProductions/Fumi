import type { ExecutorPortSummary } from "../../lib/workspace/workspace.type";

export function getExecutorPortLabel(summary: ExecutorPortSummary): string {
    if (summary.boundAccountDisplayName) {
        return summary.boundAccountDisplayName;
    }

    if (summary.isBoundToUnknownAccount) {
        return "? Unknown account";
    }

    return "Available";
}
