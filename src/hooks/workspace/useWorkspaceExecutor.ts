import { Effect } from "effect";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
    DEFAULT_EXECUTOR_KIND,
    DEFAULT_EXECUTOR_PORT,
    getExecutorPorts,
} from "../../constants/workspace/executor";
import {
    attachExecutorEffect,
    detachExecutorEffect,
    executeExecutorScriptEffect,
    getExecutorStatusEffect,
    subscribeToExecutorMessagesEffect,
    subscribeToExecutorStatusChangedEffect,
} from "../../lib/platform/executor";
import {
    interruptFiber,
    runFork,
    runPromise,
} from "../../lib/shared/effectRuntime";
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

    useEffect(() => {
        const fiber = runFork(
            getExecutorStatusEffect().pipe(
                Effect.match({
                    onSuccess: (status) => {
                        applyExecutorStatus(status);
                    },
                    onFailure: (error) => {
                        setErrorMessage(
                            getErrorMessage(
                                error,
                                "Could not restore the executor status.",
                            ),
                        );
                    },
                }),
            ),
        );

        return () => {
            void interruptFiber(fiber);
        };
    }, []);

    useEffect(() => {
        const fiber = runFork(
            Effect.matchEffect(
                Effect.scoped(
                    Effect.acquireRelease(
                        subscribeToExecutorStatusChangedEffect(
                            (status: ExecutorStatusPayload) => {
                                const wasAttached = wasAttachedRef.current;
                                applyExecutorStatus(status);

                                if (wasAttached && !status.isAttached) {
                                    setErrorMessage(
                                        "Executor connection closed.",
                                    );
                                } else if (status.isAttached) {
                                    setErrorMessage(null);
                                }

                                if (status.isAttached) {
                                    setDidRecentAttachFail(false);
                                }
                            },
                        ),
                        (unsubscribe) => Effect.sync(() => unsubscribe()),
                    ).pipe(Effect.flatMap(() => Effect.never)),
                ),
                {
                    onSuccess: () => Effect.void,
                    onFailure: (error) =>
                        Effect.sync(() => {
                            setErrorMessage(
                                getErrorMessage(
                                    error,
                                    "Could not subscribe to executor status changes.",
                                ),
                            );
                        }),
                },
            ),
        );

        return () => {
            void interruptFiber(fiber);
        };
    }, []);

    useEffect(() => {
        const fiber = runFork(
            Effect.matchEffect(
                Effect.scoped(
                    Effect.acquireRelease(
                        subscribeToExecutorMessagesEffect((payload) => {
                            if (payload.messageType === "error") {
                                console.error(
                                    "[Executor Error]",
                                    payload.message,
                                );
                            }
                        }),
                        (unsubscribe) => Effect.sync(() => unsubscribe()),
                    ).pipe(Effect.flatMap(() => Effect.never)),
                ),
                {
                    onSuccess: () => Effect.void,
                    onFailure: (error) =>
                        Effect.sync(() => {
                            console.error(
                                getErrorMessage(
                                    error,
                                    "Could not subscribe to executor messages.",
                                ),
                            );
                        }),
                },
            ),
        );

        return () => {
            void interruptFiber(fiber);
        };
    }, []);

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

            await runPromise(
                attachExecutorEffect(parsedPort).pipe(
                    Effect.match({
                        onSuccess: (status) => {
                            applyExecutorStatus(status);
                            setErrorMessage(null);
                        },
                        onFailure: (error) => {
                            console.error(
                                getErrorMessage(
                                    error,
                                    "Could not attach to the executor.",
                                ),
                            );
                            setDidRecentAttachFail(true);
                            setErrorMessage(null);
                        },
                    }),
                    Effect.ensuring(
                        Effect.sync(() => {
                            setIsBusy(false);
                        }),
                    ),
                ),
            );

            return;
        }

        setIsBusy(true);

        await runPromise(
            detachExecutorEffect().pipe(
                Effect.match({
                    onSuccess: (status) => {
                        applyExecutorStatus(status);
                        setErrorMessage(null);
                    },
                    onFailure: (error) => {
                        setErrorMessage(
                            getErrorMessage(
                                error,
                                "Could not detach from the executor.",
                            ),
                        );
                    },
                }),
                Effect.ensuring(
                    Effect.sync(() => {
                        setIsBusy(false);
                    }),
                ),
            ),
        );
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

        await runPromise(
            executeExecutorScriptEffect(activeTabContent).pipe(
                Effect.match({
                    onSuccess: () => {
                        setErrorMessage(null);
                    },
                    onFailure: (error) => {
                        setErrorMessage(
                            getErrorMessage(
                                error,
                                "Could not execute the active script.",
                            ),
                        );
                    },
                }),
                Effect.ensuring(
                    Effect.sync(() => {
                        setIsBusy(false);
                    }),
                ),
            ),
        );
    };

    return {
        executorKind,
        availablePorts,
        hasSupportedExecutor,
        port,
        isAttached,
        didRecentAttachFail,
        isBusy,
        errorMessage,
        updatePort,
        clearErrorMessage,
        toggleConnection,
        executeActiveTab,
    };
}
