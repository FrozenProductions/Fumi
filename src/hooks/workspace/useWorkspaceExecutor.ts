import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
    DEFAULT_EXECUTOR_KIND,
    DEFAULT_EXECUTOR_PORT,
    getExecutorPorts,
} from "../../constants/workspace/executor";
import { EXECUTOR_STATUS_POLL_INTERVAL_MS } from "../../constants/workspace/workspace";
import {
    attachExecutor,
    detachExecutor,
    executeExecutorScript,
    getExecutorStatus,
    subscribeToExecutorMessages,
    subscribeToExecutorStatusChanged,
} from "../../lib/platform/executor";
import { appendWorkspaceExecutionHistory } from "../../lib/platform/workspace";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import {
    getExecutorPortRangeErrorMessage,
    getExecutorPortsFromSummaries,
    normalizeExecutorPort,
    parseExecutorPort,
} from "../../lib/workspace/executor";
import {
    persistExecutorPort,
    resolvePersistedExecutorPort,
} from "../../lib/workspace/executorPersistence";
import type {
    ExecutorConsoleMessage,
    ExecutorStatusPayload,
    WorkspaceExecutionHistoryEntry,
} from "../../lib/workspace/workspace.type";
import type {
    AsyncUnsubscribe,
    UseWorkspaceExecutorOptions,
    UseWorkspaceExecutorResult,
} from "./useWorkspaceExecutor.type";

function createDefaultAvailablePortSummaries(): ExecutorStatusPayload["availablePorts"] {
    return getExecutorPorts(DEFAULT_EXECUTOR_KIND).map((port) => ({
        port,
        boundAccountId: null,
        boundAccountDisplayName: null,
        isBoundToUnknownAccount: false,
    }));
}

function manageAsyncSubscription(
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

function findSelectedPortSummary(options: {
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

function createExecutionHistoryEntry(options: {
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

const EXECUTOR_MESSAGE_LIMIT = 200;

/**
 * Manages executor connection lifecycle including attach, detach, and script execution.
 *
 * @remarks
 * Polls executor status every 2 seconds, subscribes to status changes and messages,
 * and persists the selected port. Coordinates with the workspace to execute scripts
 * on the active tab when connected.
 */
export function useWorkspaceExecutor({
    workspacePath,
    activeTab,
    onExecutionHistoryUpdated,
}: UseWorkspaceExecutorOptions): UseWorkspaceExecutorResult {
    const [executorKind, setExecutorKind] = useState(DEFAULT_EXECUTOR_KIND);
    const [availablePortSummaries, setAvailablePortSummaries] = useState<
        ExecutorStatusPayload["availablePorts"]
    >(createDefaultAvailablePortSummaries);
    const [availablePorts, setAvailablePorts] = useState<readonly number[]>([
        ...getExecutorPorts(DEFAULT_EXECUTOR_KIND),
    ]);
    const [port, setPort] = useState(String(DEFAULT_EXECUTOR_PORT));
    const [isAttached, setIsAttached] = useState(false);
    const [didRecentAttachFail, setDidRecentAttachFail] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [recentMessages, setRecentMessages] = useState<
        ExecutorConsoleMessage[]
    >([]);
    const wasAttachedRef = useRef(false);
    const syncExecutionHistoryUpdate = useEffectEvent(
        (
            requestedWorkspacePath: string,
            executionHistory: WorkspaceExecutionHistoryEntry[],
        ): void => {
            if (requestedWorkspacePath !== workspacePath) {
                return;
            }

            onExecutionHistoryUpdated?.(
                requestedWorkspacePath,
                executionHistory,
            );
        },
    );

    const applyExecutorStatus = useEffectEvent(
        (status: ExecutorStatusPayload): void => {
            const nextAvailablePorts = getExecutorPortsFromSummaries(
                status.availablePorts,
            );
            const nextPort = resolvePersistedExecutorPort({
                executorKind: status.executorKind,
                availablePorts: status.availablePorts,
                fallbackPort: status.port,
            });
            setExecutorKind(status.executorKind);
            setAvailablePortSummaries(status.availablePorts);
            setAvailablePorts(nextAvailablePorts);
            setPort(
                normalizeExecutorPort(String(nextPort), nextAvailablePorts),
            );
            setIsAttached(status.isAttached);
            setDidRecentAttachFail(false);
            wasAttachedRef.current = status.isAttached;
            persistExecutorPort(status.executorKind, nextPort);
        },
    );

    useEffect(() => {
        let intervalId: number | null = null;
        let isCancelled = false;

        const refreshExecutorStatus = async (): Promise<void> => {
            try {
                const status = await getExecutorStatus();

                if (!isCancelled) {
                    applyExecutorStatus(status);
                }
            } catch (error) {
                if (!isCancelled) {
                    setErrorMessage(
                        getErrorMessage(
                            error,
                            "Could not restore the executor status.",
                        ),
                    );
                }
            }
        };

        void refreshExecutorStatus();
        intervalId = window.setInterval(() => {
            void refreshExecutorStatus();
        }, EXECUTOR_STATUS_POLL_INTERVAL_MS);

        return () => {
            isCancelled = true;
            if (intervalId !== null) {
                window.clearInterval(intervalId);
            }
        };
    }, []);

    useEffect(() => {
        return manageAsyncSubscription(
            () =>
                subscribeToExecutorStatusChanged(
                    (status: ExecutorStatusPayload) => {
                        const wasAttached = wasAttachedRef.current;
                        applyExecutorStatus(status);

                        if (wasAttached && !status.isAttached) {
                            setErrorMessage("Executor connection closed.");
                        } else if (status.isAttached) {
                            setErrorMessage(null);
                        }

                        if (status.isAttached) {
                            setDidRecentAttachFail(false);
                        }
                    },
                ),
            (error) => {
                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Could not subscribe to executor status changes.",
                    ),
                );
            },
        );
    }, []);

    useEffect(() => {
        return manageAsyncSubscription(
            () =>
                subscribeToExecutorMessages((payload) => {
                    setRecentMessages((currentMessages) => {
                        const nextMessages = [
                            ...currentMessages,
                            {
                                ...payload,
                                id: crypto.randomUUID(),
                                receivedAt: Date.now(),
                            } satisfies ExecutorConsoleMessage,
                        ];

                        return nextMessages.slice(-EXECUTOR_MESSAGE_LIMIT);
                    });

                    if (payload.messageType === "error") {
                        console.error("[Executor Error]", payload.message);
                    }
                }),
            (error) => {
                console.error(
                    getErrorMessage(
                        error,
                        "Could not subscribe to executor messages.",
                    ),
                );
            },
        );
    }, []);

    useEffect(() => {
        if (!didRecentAttachFail) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setDidRecentAttachFail(false);
        }, 3_000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [didRecentAttachFail]);

    const updatePort = (value: string): void => {
        const nextPort = normalizeExecutorPort(value, availablePorts);
        setPort(nextPort);
        setDidRecentAttachFail(false);
        setErrorMessage(null);
        const parsedPort = parseExecutorPort(nextPort, availablePorts);
        if (parsedPort !== null) {
            persistExecutorPort(executorKind, parsedPort);
        }
    };

    const clearErrorMessage = (): void => {
        setErrorMessage(null);
    };

    const clearRecentMessages = (): void => {
        setRecentMessages([]);
    };

    const hasSupportedExecutor = executorKind !== "unsupported";

    const toggleConnection = async (): Promise<void> => {
        if (isBusy) {
            return;
        }

        if (!hasSupportedExecutor) {
            setErrorMessage("No supported executor detected.");
            return;
        }

        if (!isAttached) {
            const parsedPort = parseExecutorPort(port, availablePorts);

            if (parsedPort === null) {
                setDidRecentAttachFail(false);
                setErrorMessage(
                    getExecutorPortRangeErrorMessage(availablePorts),
                );
                return;
            }

            setIsBusy(true);
            setDidRecentAttachFail(false);
            setErrorMessage(null);

            try {
                const status = await attachExecutor(parsedPort);
                applyExecutorStatus(status);
                setErrorMessage(null);
            } catch (error) {
                console.error(
                    getErrorMessage(error, "Could not attach to the executor."),
                );
                setDidRecentAttachFail(true);
                setErrorMessage(null);
            } finally {
                setIsBusy(false);
            }

            return;
        }

        setIsBusy(true);

        try {
            const status = await detachExecutor();
            applyExecutorStatus(status);
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Could not detach from the executor."),
            );
        } finally {
            setIsBusy(false);
        }
    };

    const executeScript = async (options: {
        fileName: string;
        scriptContent: string;
        executeFailureMessage: string;
    }): Promise<void> => {
        if (isBusy) {
            return;
        }

        if (!hasSupportedExecutor) {
            setErrorMessage("No supported executor detected.");
            return;
        }

        if (!isAttached) {
            setErrorMessage("Attach to an executor port before executing.");
            return;
        }

        const requestedWorkspacePath = workspacePath;
        const selectedPort = parseExecutorPort(port, availablePorts);
        const selectedPortSummary = findSelectedPortSummary({
            port,
            availablePorts,
            availablePortSummaries,
        });
        const entry =
            requestedWorkspacePath === null
                ? null
                : createExecutionHistoryEntry({
                      executorKind,
                      port: selectedPort,
                      selectedPortSummary,
                      fileName: options.fileName,
                      scriptContent: options.scriptContent,
                  });

        setIsBusy(true);

        try {
            await executeExecutorScript(options.scriptContent);
            setErrorMessage(null);

            if (!requestedWorkspacePath || !entry) {
                return;
            }

            try {
                const executionHistory = await appendWorkspaceExecutionHistory({
                    workspacePath: requestedWorkspacePath,
                    entry,
                });

                syncExecutionHistoryUpdate(
                    requestedWorkspacePath,
                    executionHistory,
                );
            } catch (error) {
                console.error(
                    getErrorMessage(
                        error,
                        "Could not save the execution history.",
                    ),
                );
                setErrorMessage(
                    "Executed script, but could not save execution history.",
                );
            }
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, options.executeFailureMessage),
            );
        } finally {
            setIsBusy(false);
        }
    };

    const executeActiveTab = async (): Promise<void> => {
        if (!activeTab) {
            setErrorMessage("Open a workspace tab before executing a script.");
            return;
        }

        await executeScript({
            fileName: activeTab.fileName,
            scriptContent: activeTab.content,
            executeFailureMessage: "Could not execute the active script.",
        });
    };

    const executeHistoryEntry = async (
        entry: WorkspaceExecutionHistoryEntry,
    ): Promise<void> => {
        await executeScript({
            fileName: entry.fileName,
            scriptContent: entry.scriptContent,
            executeFailureMessage:
                "Could not execute the selected history entry.",
        });
    };

    return {
        state: {
            executorKind,
            availablePorts,
            availablePortSummaries,
            hasSupportedExecutor,
            port,
            isAttached,
            didRecentAttachFail,
            isBusy,
            errorMessage,
            recentMessages,
        },
        actions: {
            updatePort,
            clearErrorMessage,
            toggleConnection,
            executeActiveTab,
            executeHistoryEntry,
            clearRecentMessages,
        },
    };
}
