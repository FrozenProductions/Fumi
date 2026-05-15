import type { ExecutorStatusPayload } from "../../lib/workspace/executor/executor.type";

export type WorkspaceExecutorLocalState = {
    executorKind: ExecutorStatusPayload["executorKind"];
    availablePortSummaries: ExecutorStatusPayload["availablePorts"];
    port: string;
    isAttached: boolean;
    didRecentAttachFail: boolean;
    isBusy: boolean;
    errorMessage: string | null;
};

export type WorkspaceExecutorLocalStateUpdate =
    | Partial<WorkspaceExecutorLocalState>
    | ((
          currentState: WorkspaceExecutorLocalState,
      ) => Partial<WorkspaceExecutorLocalState>);
