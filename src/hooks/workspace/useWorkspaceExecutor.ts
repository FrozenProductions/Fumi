import { useEffect, useEffectEvent, useMemo, useReducer, useRef } from "react";
import {
    DEFAULT_EXECUTOR_KIND,
    DEFAULT_EXECUTOR_PORT,
} from "../../constants/workspace/executor";
import {
    getExecutorStatus,
    subscribeToExecutorStatusChanged,
} from "../../lib/platform/roblox/executor";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import type { WorkspaceExecutionHistoryEntry } from "../../lib/workspace/executionHistory/executionHistory.type";
import {
    getExecutorPortsFromSummaries,
    normalizeExecutorPort,
    parseExecutorPort,
} from "../../lib/workspace/executor/executor";
import type {
    ExecutorStatusPayload,
    UseWorkspaceExecutorOptions,
    UseWorkspaceExecutorResult,
} from "../../lib/workspace/executor/executor.type";
import {
    executeWorkspaceScript,
    toggleExecutorConnection,
} from "../../lib/workspace/executor/executorActions";
import {
    persistExecutorPort,
    resolvePersistedExecutorPort,
} from "../../lib/workspace/executor/executorPersistence";
import {
    createDefaultAvailablePortSummaries,
    manageAsyncSubscription,
} from "../../lib/workspace/executor/executorStatus";
import { selectWorkspaceActiveTab } from "../../lib/workspace/store/selectors";
import { useWindowResume } from "../shared/useWindowResume";
import type {
    WorkspaceExecutorLocalState,
    WorkspaceExecutorLocalStateUpdate,
} from "./useWorkspaceExecutor.type";
import { useWorkspaceStore } from "./useWorkspaceStore";

function updateWorkspaceExecutorLocalState(
    currentState: WorkspaceExecutorLocalState,
    update: WorkspaceExecutorLocalStateUpdate,
): WorkspaceExecutorLocalState {
    const nextState =
        typeof update === "function" ? update(currentState) : update;

    return {
        ...currentState,
        ...nextState,
    };
}

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
    const [state, setState] = useReducer(updateWorkspaceExecutorLocalState, {
        executorKind: DEFAULT_EXECUTOR_KIND,
        availablePortSummaries: createDefaultAvailablePortSummaries(),
        port: String(DEFAULT_EXECUTOR_PORT),
        isAttached: false,
        didRecentAttachFail: false,
        isBusy: false,
        errorMessage: null,
    });
    const {
        executorKind,
        availablePortSummaries,
        port,
        isAttached,
        didRecentAttachFail,
        isBusy,
        errorMessage,
    } = state;
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
            setState({
                executorKind: status.executorKind,
                availablePortSummaries: status.availablePorts,
                port: normalizeExecutorPort(
                    String(nextPort),
                    nextAvailablePorts,
                ),
                isAttached: status.isAttached,
                didRecentAttachFail: false,
            });
            wasAttachedRef.current = status.isAttached;
            persistExecutorPort(status.executorKind, nextPort);
        },
    );

    const refreshExecutorStatus = useEffectEvent(
        async (failureMessage: string): Promise<void> => {
            try {
                const status = await getExecutorStatus();
                applyExecutorStatus(status);
                setState({ errorMessage: null });
            } catch (error) {
                setState({
                    errorMessage: getErrorMessage(error, failureMessage),
                });
            }
        },
    );

    useEffect(() => {
        void refreshExecutorStatus("Could not restore the executor status.");
    }, []);

    useWindowResume(() => {
        void refreshExecutorStatus("Could not refresh the executor status.");
    });

    const handleExecutorStatusChanged = useEffectEvent(
        (status: ExecutorStatusPayload): void => {
            const wasAttached = wasAttachedRef.current;
            applyExecutorStatus(status);

            if (wasAttached && !status.isAttached) {
                setState({
                    errorMessage: "Executor connection closed.",
                });
            } else if (status.isAttached) {
                setState({ errorMessage: null });
            }

            if (status.isAttached) {
                setState({ didRecentAttachFail: false });
            }
        },
    );

    const handleExecutorStatusSubscribeError = useEffectEvent(
        (error: unknown): void => {
            setState({
                errorMessage: getErrorMessage(
                    error,
                    "Could not subscribe to executor status changes.",
                ),
            });
        },
    );

    useEffect(() => {
        return manageAsyncSubscription(
            () => subscribeToExecutorStatusChanged(handleExecutorStatusChanged),
            handleExecutorStatusSubscribeError,
        );
    }, []);

    useEffect(() => {
        if (!didRecentAttachFail) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setState({ didRecentAttachFail: false });
        }, 3_000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [didRecentAttachFail]);

    const updatePort = (value: string): void => {
        const nextPort = normalizeExecutorPort(value, availablePorts);
        setState({
            port: nextPort,
            didRecentAttachFail: false,
            errorMessage: null,
        });
        const parsedPort = parseExecutorPort(nextPort, availablePorts);
        if (parsedPort !== null) {
            persistExecutorPort(executorKind, parsedPort);
        }
    };

    const clearErrorMessage = (): void => {
        setState({ errorMessage: null });
    };

    const hasSupportedExecutor = executorKind !== "unsupported";
    const setDidRecentAttachFail = (value: boolean): void => {
        setState({ didRecentAttachFail: value });
    };
    const setErrorMessage = (value: string | null): void => {
        setState({ errorMessage: value });
    };
    const setIsBusy = (value: boolean): void => {
        setState({ isBusy: value });
    };

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

    const attachToPort = async (nextPort: number): Promise<void> => {
        const normalizedPort = normalizeExecutorPort(
            String(nextPort),
            availablePorts,
        );
        setState({
            port: normalizedPort,
            didRecentAttachFail: false,
            errorMessage: null,
        });
        const parsedPort = parseExecutorPort(normalizedPort, availablePorts);

        if (parsedPort !== null) {
            persistExecutorPort(executorKind, parsedPort);
        }

        await toggleExecutorConnection({
            isBusy,
            hasSupportedExecutor,
            isAttached: false,
            port: normalizedPort,
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
            attachToPort,
            toggleConnection,
            executeActiveTab,
            executeHistoryEntry,
        },
    };
}
