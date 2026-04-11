import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
    DEFAULT_EXECUTOR_KIND,
    DEFAULT_EXECUTOR_PORT,
    getExecutorPorts,
} from "../../constants/workspace/executor";
import {
    attachExecutor,
    detachExecutor,
    executeExecutorScript,
    getExecutorStatus,
    subscribeToExecutorMessages,
    subscribeToExecutorStatusChanged,
} from "../../lib/platform/executor";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import {
    getExecutorPortRangeErrorMessage,
    normalizeExecutorPort,
    parseExecutorPort,
} from "../../lib/workspace/executor";
import {
    persistExecutorPort,
    resolvePersistedExecutorPort,
} from "../../lib/workspace/executorPersistence";
import type { ExecutorStatusPayload } from "../../lib/workspace/workspace.type";
import type {
    UseWorkspaceExecutorOptions,
    UseWorkspaceExecutorResult,
} from "./useWorkspaceExecutor.type";

type AsyncUnsubscribe = () => void;

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

export function useWorkspaceExecutor({
    activeTabContent,
}: UseWorkspaceExecutorOptions): UseWorkspaceExecutorResult {
    const [executorKind, setExecutorKind] = useState(DEFAULT_EXECUTOR_KIND);
    const [availablePorts, setAvailablePorts] = useState<readonly number[]>([
        ...getExecutorPorts(DEFAULT_EXECUTOR_KIND),
    ]);
    const [port, setPort] = useState(String(DEFAULT_EXECUTOR_PORT));
    const [isAttached, setIsAttached] = useState(false);
    const [didRecentAttachFail, setDidRecentAttachFail] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const wasAttachedRef = useRef(false);

    const applyExecutorStatus = useEffectEvent(
        (status: ExecutorStatusPayload): void => {
            const nextPort = resolvePersistedExecutorPort({
                executorKind: status.executorKind,
                availablePorts: status.availablePorts,
                fallbackPort: status.port,
            });
            setExecutorKind(status.executorKind);
            setAvailablePorts(status.availablePorts);
            setPort(
                normalizeExecutorPort(String(nextPort), status.availablePorts),
            );
            setIsAttached(status.isAttached);
            setDidRecentAttachFail(false);
            wasAttachedRef.current = status.isAttached;
            persistExecutorPort(status.executorKind, nextPort);
        },
    );

    useEffect(() => {
        let isCancelled = false;

        void (async () => {
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
        })();

        return () => {
            isCancelled = true;
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

    const executeActiveTab = async (): Promise<void> => {
        if (isBusy) {
            return;
        }

        if (activeTabContent === null) {
            setErrorMessage("Open a workspace tab before executing a script.");
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

        setIsBusy(true);

        try {
            await executeExecutorScript(activeTabContent);
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Could not execute the active script."),
            );
        } finally {
            setIsBusy(false);
        }
    };

    return {
        state: {
            executorKind,
            availablePorts,
            hasSupportedExecutor,
            port,
            isAttached,
            didRecentAttachFail,
            isBusy,
            errorMessage,
        },
        actions: {
            updatePort,
            clearErrorMessage,
            toggleConnection,
            executeActiveTab,
        },
    };
}
