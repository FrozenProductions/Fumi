import type {
    WorkspaceExecutorActions,
    WorkspaceExecutorState,
} from "../../workspace/executor/executor.type";

/** Partial overrides for workspace executor state and actions in tests. */
export type WorkspaceExecutorOverrides = {
    state?: Partial<WorkspaceExecutorState>;
    actions?: Partial<WorkspaceExecutorActions>;
};
