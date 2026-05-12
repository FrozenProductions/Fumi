import type { ExecutorKind } from "../executor/executor.type";

export type WorkspaceExecutionHistoryEntry = {
    id: string;
    executedAt: number;
    executorKind: ExecutorKind;
    port: number;
    accountId: string | null;
    accountDisplayName: string | null;
    isBoundToUnknownAccount: boolean;
    fileName: string;
    scriptContent: string;
};
