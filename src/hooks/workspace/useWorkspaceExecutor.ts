import { useEffect, useRef, useState } from "react";
import {
    DEFAULT_EXECUTOR_PORT,
    MAX_EXECUTOR_PORT,
    MIN_EXECUTOR_PORT,
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
import type { ExecutorStatusPayload } from "../../types/workspace/executor";

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

function parseExecutorPort(port: string): number | null {
    const trimmedPort = port.trim();

    if (trimmedPort.length === 0) {
        return null;
    }

    const parsedPort = Number.parseInt(trimmedPort, 10);

    if (
        !Number.isInteger(parsedPort) ||
        parsedPort < MIN_EXECUTOR_PORT ||
        parsedPort > MAX_EXECUTOR_PORT
    ) {
        return null;
    }

    return parsedPort;
}

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
        let isMounted = true;

        void getExecutorStatus()
            .then((status) => {
                if (!isMounted) {
                    return;
                }

                setPort(String(status.port));
                setIsAttached(status.isAttached);
                setDidRecentAttachFail(false);
                wasAttachedRef.current = status.isAttached;
            })
            .catch((error) => {
                if (!isMounted) {
                    return;
                }

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Could not restore the executor status.",
                    ),
                );
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let cleanup = (): void => undefined;
        let isCancelled = false;

        void subscribeToExecutorStatusChanged(
            (status: ExecutorStatusPayload) => {
                setPort(String(status.port));
                setIsAttached(status.isAttached);

                if (wasAttachedRef.current && !status.isAttached) {
                    setErrorMessage("MacSploit connection closed.");
                } else if (status.isAttached) {
                    setErrorMessage(null);
                }

                if (status.isAttached) {
                    setDidRecentAttachFail(false);
                }

                wasAttachedRef.current = status.isAttached;
            },
        ).then((unsubscribe) => {
            if (isCancelled) {
                unsubscribe();
                return;
            }

            cleanup = unsubscribe;
        });

        return () => {
            isCancelled = true;
            cleanup();
        };
    }, []);

    useEffect(() => {
        let cleanup = (): void => undefined;
        let isCancelled = false;

        void subscribeToExecutorMessages((payload) => {
            if (payload.messageType === "error") {
                console.error("[MacSploit Error]", payload.message);
                return;
            }

            console.log("[MacSploit Debug]", payload.message);
        }).then((unsubscribe) => {
            if (isCancelled) {
                unsubscribe();
                return;
            }

            cleanup = unsubscribe;
        });

        return () => {
            isCancelled = true;
            cleanup();
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
                setErrorMessage(
                    `Port must be between ${MIN_EXECUTOR_PORT} and ${MAX_EXECUTOR_PORT}.`,
                );
                return;
            }

            setIsBusy(true);
            setDidRecentAttachFail(false);
            setErrorMessage(null);

            try {
                const status = await attachExecutor(parsedPort);

                setPort(String(status.port));
                setIsAttached(status.isAttached);
                setDidRecentAttachFail(false);
                setErrorMessage(null);
                wasAttachedRef.current = status.isAttached;
            } catch (error) {
                console.error(
                    getErrorMessage(error, "Could not attach to MacSploit."),
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

            setPort(String(status.port));
            setIsAttached(status.isAttached);
            setDidRecentAttachFail(false);
            setErrorMessage(null);
            wasAttachedRef.current = status.isAttached;
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Could not detach from MacSploit."),
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

        if (!isAttached) {
            setErrorMessage("Attach to a MacSploit port before executing.");
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
