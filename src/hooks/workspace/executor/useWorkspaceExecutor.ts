import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
    DEFAULT_EXECUTOR_KIND,
    DEFAULT_EXECUTOR_PORT,
} from "../../../constants/workspace/executor";
import {
    getExecutorStatus,
    subscribeToExecutorStatusChanged,
} from "../../../lib/platform/executor";
import { getErrorMessage } from "../../../lib/shared/errorMessage";
import {
    getExecutorPortsFromSummaries,
    normalizeExecutorPort,
    parseExecutorPort,
} from "../../../lib/workspace/executor/executor";
import {
    executeWorkspaceScript,
    toggleExecutorConnection,
} from "../../../lib/workspace/executor/executorActions";
import {
    persistExecutorPort,
    resolvePersistedExecutorPort,
} from "../../../lib/workspace/executor/executorPersistence";
import {
    createDefaultAvailablePortSummaries,
    manageAsyncSubscription,
} from "../../../lib/workspace/executor/executorStatus";
import { selectWorkspaceActiveTab } from "../../../lib/workspace/store/selectors";
import type {
    ExecutorStatusPayload,
    WorkspaceExecutionHistoryEntry,
} from "../../../lib/workspace/workspace.type";
import { useWindowResume } from "../../shared/useWindowResume";
import { useWorkspaceStore } from "../useWorkspaceStore";
import type {
    UseWorkspaceExecutorOptions,
    UseWorkspaceExecutorResult,
} from "./useWorkspaceExecutor.type";

/**
 * Manages executor connection lifecycle including attach, detach, and script execution.
 *
 * @remarks
 * Hydrates executor status on mount, refreshes it when the window regains focus,
 * subscribes to status changes and messages, and persists the selected port.
 * Coordinates with the workspace to execute scripts on the active tab when connected.
 */
export function useWorkspaceExecutor({
    workspacePath,
    onExecutionHistoryUpdated,
}: UseWorkspaceExecutorOptions): UseWorkspaceExecutorResult {
    const [executorKind, setExecutorKind] = useState(DEFAULT_EXECUTOR_KIND);
    const [availablePortSummaries, setAvailablePortSummaries] = useState<
        ExecutorStatusPayload["availablePorts"]
    >(createDefaultAvailablePortSummaries);
    const [port, setPort] = useState(String(DEFAULT_EXECUTOR_PORT));
    const [isAttached, setIsAttached] = useState(false);
    const [didRecentAttachFail, setDidRecentAttachFail] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const availablePorts = useMemo(
        () => getExecutorPortsFromSummaries(availablePortSummaries),
        [availablePortSummaries],
    );
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
            setPort(
                normalizeExecutorPort(String(nextPort), nextAvailablePorts),
            );
            setIsAttached(status.isAttached);
            setDidRecentAttachFail(false);
            wasAttachedRef.current = status.isAttached;
            persistExecutorPort(status.executorKind, nextPort);
        },
    );

    const refreshExecutorStatus = useEffectEvent(
        async (failureMessage: string): Promise<void> => {
            try {
                const status = await getExecutorStatus();
                applyExecutorStatus(status);
                setErrorMessage(null);
            } catch (error) {
                setErrorMessage(getErrorMessage(error, failureMessage));
            }
        },
    );

    useEffect(() => {
        void refreshExecutorStatus("Could not restore the executor status.");
    }, []);

    useWindowResume(() => {
        void refreshExecutorStatus("Could not refresh the executor status.");
    });

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
        await toggleExecutorConnection({
            isBusy,
            hasSupportedExecutor,
            isAttached,
            port,
            availablePorts,
            applyExecutorStatus,
            setDidRecentAttachFail,
            setErrorMessage,
            setIsBusy,
        });
    };

    const executeScript = async (options: {
        fileName: string;
        scriptContent: string;
        executeFailureMessage: string;
    }): Promise<void> => {
        await executeWorkspaceScript({
            isBusy,
            hasSupportedExecutor,
            isAttached,
            workspacePath,
            executorKind,
            port,
            availablePorts,
            availablePortSummaries,
            fileName: options.fileName,
            scriptContent: options.scriptContent,
            executeFailureMessage: options.executeFailureMessage,
            setErrorMessage,
            setIsBusy,
            syncExecutionHistoryUpdate,
        });
    };

    const executeActiveTab = async (): Promise<void> => {
        const activeTab = selectWorkspaceActiveTab(
            useWorkspaceStore.getState(),
        );

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
        },
        actions: {
            updatePort,
            clearErrorMessage,
            toggleConnection,
            executeActiveTab,
            executeHistoryEntry,
        },
    };
}
