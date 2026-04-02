import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_EXECUTOR_PORT } from "../../constants/workspace/executor";
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
    parseExecutorPort,
} from "../../lib/workspace/executor";
import type { ExecutorStatusPayload } from "../../lib/workspace/workspace.type";

type UseWorkspaceExecutorOptions = {
    activeTabContent: string | null;
};

export type UseWorkspaceExecutorResult = {
    port: string;
    isAttached: boolean;
    didRecentAttachFail: boolean;
    isBusy: boolean;
    errorMessage: string | null;
    updatePort: (value: string) => void;
    clearErrorMessage: () => void;
    toggleConnection: () => Promise<void>;
    executeActiveTab: () => Promise<void>;
};

export function useWorkspaceExecutor({
    activeTabContent,
}: UseWorkspaceExecutorOptions): UseWorkspaceExecutorResult {
    const [port, setPort] = useState(String(DEFAULT_EXECUTOR_PORT));
    const [isAttached, setIsAttached] = useState(false);
    const [didRecentAttachFail, setDidRecentAttachFail] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const wasAttachedRef = useRef(false);

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
                        setPort(String(status.port));
                        setIsAttached(status.isAttached);
                        setDidRecentAttachFail(false);
                        wasAttachedRef.current = status.isAttached;
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
                                setPort(String(status.port));
                                setIsAttached(status.isAttached);

                                if (
                                    wasAttachedRef.current &&
                                    !status.isAttached
                                ) {
                                    setErrorMessage(
                                        "MacSploit connection closed.",
                                    );
                                } else if (status.isAttached) {
                                    setErrorMessage(null);
                                }

                                if (status.isAttached) {
                                    setDidRecentAttachFail(false);
                                }

                                wasAttachedRef.current = status.isAttached;
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
                                    "[MacSploit Error]",
                                    payload.message,
                                );
                                return;
                            }

                            console.log("[MacSploit Debug]", payload.message);
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
        setPort(value);
        setDidRecentAttachFail(false);
        setErrorMessage(null);
    };

    const clearErrorMessage = (): void => {
        setErrorMessage(null);
    };

    const toggleConnection = async (): Promise<void> => {
        if (isBusy) {
            return;
        }

        if (!isAttached) {
            const parsedPort = parseExecutorPort(port);

            if (parsedPort === null) {
                setDidRecentAttachFail(false);
                setErrorMessage(getExecutorPortRangeErrorMessage());
                return;
            }

            setIsBusy(true);
            setDidRecentAttachFail(false);
            setErrorMessage(null);

            await runPromise(
                attachExecutorEffect(parsedPort).pipe(
                    Effect.match({
                        onSuccess: (status) => {
                            setPort(String(status.port));
                            setIsAttached(status.isAttached);
                            setDidRecentAttachFail(false);
                            setErrorMessage(null);
                            wasAttachedRef.current = status.isAttached;
                        },
                        onFailure: (error) => {
                            console.error(
                                getErrorMessage(
                                    error,
                                    "Could not attach to MacSploit.",
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
                        setPort(String(status.port));
                        setIsAttached(status.isAttached);
                        setDidRecentAttachFail(false);
                        setErrorMessage(null);
                        wasAttachedRef.current = status.isAttached;
                    },
                    onFailure: (error) => {
                        setErrorMessage(
                            getErrorMessage(
                                error,
                                "Could not detach from MacSploit.",
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

        if (!isAttached) {
            setErrorMessage("Attach to a MacSploit port before executing.");
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
