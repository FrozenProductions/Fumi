import type { ExecutorKind } from "../workspace.type";

export type WorkspaceExecutionHistoryFilterValue =
    | "all"
    | Exclude<ExecutorKind, "unsupported">;

export type WorkspaceExecutionHistorySearchFieldName =
    | "account"
    | "content"
    | "executor"
    | "fileName"
    | "port";
