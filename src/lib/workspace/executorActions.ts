import {
    attachExecutor,
    detachExecutor,
    executeExecutorScript,
} from "../platform/executor";
import { appendWorkspaceExecutionHistory } from "../platform/workspace";
import { getErrorMessage } from "../shared/errorMessage";
import {
    getExecutorPortRangeErrorMessage,
    parseExecutorPort,
} from "./executor";
import {
    createExecutionHistoryEntry,
    findSelectedPortSummary,
} from "./executorStatus";
import type {
    ExecutorKind,
    ExecutorStatusPayload,
    WorkspaceExecutionHistoryEntry,
} from "./workspace.type";

type SetBoolean = (value: boolean) => void;
type SetStringOrNull = (value: string | null) => void;
type ApplyExecutorStatus = (status: ExecutorStatusPayload) => void;
type SyncExecutionHistoryUpdate = (
    workspacePath: string,
    executionHistory: WorkspaceExecutionHistoryEntry[],
) => void;

type ToggleExecutorConnectionOptions = {
    isBusy: boolean;
    hasSupportedExecutor: boolean;
    isAttached: boolean;
    port: string;
    availablePorts: readonly number[];
    applyExecutorStatus: ApplyExecutorStatus;
    setDidRecentAttachFail: SetBoolean;
    setErrorMessage: SetStringOrNull;
    setIsBusy: SetBoolean;
};

type ExecuteWorkspaceScriptOptions = {
    isBusy: boolean;
    hasSupportedExecutor: boolean;
    isAttached: boolean;
    workspacePath: string | null;
    executorKind: ExecutorKind;
    port: string;
    availablePorts: readonly number[];
    availablePortSummaries: ExecutorStatusPayload["availablePorts"];
    fileName: string;
    scriptContent: string;
    executeFailureMessage: string;
    setErrorMessage: SetStringOrNull;
    setIsBusy: SetBoolean;
    syncExecutionHistoryUpdate: SyncExecutionHistoryUpdate;
};

/**
 * Attaches or detaches the executor connection using the current UI state.
 */
export async function toggleExecutorConnection(
    options: ToggleExecutorConnectionOptions,
): Promise<void> {
    if (options.isBusy) {
        return;
    }

    if (!options.hasSupportedExecutor) {
        options.setErrorMessage("No supported executor detected.");
        return;
    }

    if (!options.isAttached) {
        const parsedPort = parseExecutorPort(
            options.port,
            options.availablePorts,
        );

        if (parsedPort === null) {
            options.setDidRecentAttachFail(false);
            options.setErrorMessage(
                getExecutorPortRangeErrorMessage(options.availablePorts),
            );
            return;
        }

        options.setIsBusy(true);
        options.setDidRecentAttachFail(false);
        options.setErrorMessage(null);

        try {
            const status = await attachExecutor(parsedPort);
            options.applyExecutorStatus(status);
            options.setErrorMessage(null);
        } catch (error) {
            console.error(
                getErrorMessage(error, "Could not attach to the executor."),
            );
            options.setDidRecentAttachFail(true);
            options.setErrorMessage(null);
        } finally {
            options.setIsBusy(false);
        }

        return;
    }

    options.setIsBusy(true);

    try {
        const status = await detachExecutor();
        options.applyExecutorStatus(status);
        options.setErrorMessage(null);
    } catch (error) {
        options.setErrorMessage(
            getErrorMessage(error, "Could not detach from the executor."),
        );
    } finally {
        options.setIsBusy(false);
    }
}

/**
 * Executes a script through the current executor connection and persists history when possible.
 */
export async function executeWorkspaceScript(
    options: ExecuteWorkspaceScriptOptions,
): Promise<void> {
    if (options.isBusy) {
        return;
    }

    if (!options.hasSupportedExecutor) {
        options.setErrorMessage("No supported executor detected.");
        return;
    }

    if (!options.isAttached) {
        options.setErrorMessage("Attach to an executor port before executing.");
        return;
    }

    const requestedWorkspacePath = options.workspacePath;
    const selectedPort = parseExecutorPort(
        options.port,
        options.availablePorts,
    );
    const selectedPortSummary = findSelectedPortSummary({
        port: options.port,
        availablePorts: options.availablePorts,
        availablePortSummaries: options.availablePortSummaries,
    });
    const entry =
        requestedWorkspacePath === null
            ? null
            : createExecutionHistoryEntry({
                  executorKind: options.executorKind,
                  port: selectedPort,
                  selectedPortSummary,
                  fileName: options.fileName,
                  scriptContent: options.scriptContent,
              });

    options.setIsBusy(true);

    try {
        await executeExecutorScript(options.scriptContent);
        options.setErrorMessage(null);

        if (!requestedWorkspacePath || !entry) {
            return;
        }

        try {
            const executionHistory = await appendWorkspaceExecutionHistory({
                workspacePath: requestedWorkspacePath,
                entry,
            });

            options.syncExecutionHistoryUpdate(
                requestedWorkspacePath,
                executionHistory,
            );
        } catch (error) {
            console.error(
                getErrorMessage(error, "Could not save the execution history."),
            );
            options.setErrorMessage(
                "Executed script, but could not save execution history.",
            );
        }
    } catch (error) {
        options.setErrorMessage(
            getErrorMessage(error, options.executeFailureMessage),
        );
    } finally {
        options.setIsBusy(false);
    }
}
