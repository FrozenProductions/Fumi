import {
    DEFAULT_EXECUTOR_KIND,
    getExecutorPorts,
} from "../../../constants/workspace/executor";
import type {
    ExecutorStatusPayload,
    WorkspaceExecutionHistoryEntry,
} from "../workspace.type";
import { parseExecutorPort } from "./executor";

export type AsyncUnsubscribe = () => void;

/**
 * Creates the initial executor port summaries before the desktop status hydrates.
 */
export function createDefaultAvailablePortSummaries(): ExecutorStatusPayload["availablePorts"] {
    return getExecutorPorts(DEFAULT_EXECUTOR_KIND).map((port) => ({
        port,
        boundAccountId: null,
        boundAccountDisplayName: null,
        isBoundToUnknownAccount: false,
    }));
}

/**
 * Registers an async subscription and safely disposes it if the caller unmounts early.
 */
export function manageAsyncSubscription(
    start: () => Promise<AsyncUnsubscribe>,
    onError: (error: unknown) => void,
): () => void {
    let isDisposed = false;
    let unsubscribe: AsyncUnsubscribe | null = null;

    void start()
        .then((nextUnsubscribe) => {
            if (isDisposed) {
                nextUnsubscribe();
                return;
            }

            unsubscribe = nextUnsubscribe;
        })
        .catch((error: unknown) => {
            if (!isDisposed) {
                onError(error);
            }
        });

    return () => {
        isDisposed = true;
        unsubscribe?.();
    };
}

/**
 * Resolves the selected port summary for execution history metadata.
 */
export function findSelectedPortSummary(options: {
    port: string;
    availablePorts: readonly number[];
    availablePortSummaries: ExecutorStatusPayload["availablePorts"];
}): ExecutorStatusPayload["availablePorts"][number] | null {
    const parsedPort = parseExecutorPort(options.port, options.availablePorts);

    if (parsedPort === null) {
        return null;
    }

    return (
        options.availablePortSummaries.find(
            (summary) => summary.port === parsedPort,
        ) ?? null
    );
}

/**
 * Creates an execution history entry for a successful manual execute.
 */
export function createExecutionHistoryEntry(options: {
    executorKind: ExecutorStatusPayload["executorKind"];
    port: number | null;
    selectedPortSummary: ExecutorStatusPayload["availablePorts"][number] | null;
    fileName: string;
    scriptContent: string;
}): WorkspaceExecutionHistoryEntry | null {
    if (options.port === null) {
        return null;
    }

    return {
        id: crypto.randomUUID(),
        executedAt: Date.now(),
        executorKind: options.executorKind,
        port: options.port,
        accountId: options.selectedPortSummary?.boundAccountId ?? null,
        accountDisplayName:
            options.selectedPortSummary?.boundAccountDisplayName ?? null,
        isBoundToUnknownAccount:
            options.selectedPortSummary?.isBoundToUnknownAccount ?? false,
        fileName: options.fileName,
        scriptContent: options.scriptContent,
    };
}
