import type { ExecutorKind } from "../executor/executor.type";

export type WorkspaceExecutionHistoryFilterValue =
    | "all"
    | Exclude<ExecutorKind, "unsupported">;

export type WorkspaceExecutionHistorySearchFieldName =
    | "account"
    | "content"
    | "executor"
    | "fileName"
    | "port";
