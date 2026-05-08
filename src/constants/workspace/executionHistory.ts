import type { AppSelectOption } from "../../components/app/form/AppSelect.type";
import type {
    WorkspaceExecutionHistoryFilterValue,
    WorkspaceExecutionHistorySearchFieldName,
} from "../../lib/workspace/executionHistory/executionHistorySearch.type";

export const DEFAULT_WORKSPACE_EXECUTION_HISTORY_FILTER =
    "all" satisfies WorkspaceExecutionHistoryFilterValue;

export const WORKSPACE_EXECUTION_HISTORY_SEARCH_DEBOUNCE_MS = 400;

export const WORKSPACE_EXECUTION_HISTORY_FILTER_OPTIONS = [
    {
        value: "all",
        label: "All Executors",
    },
    {
        value: "macsploit",
        label: "Macsploit",
    },
    {
        value: "opiumware",
        label: "OpiumWare",
    },
] satisfies AppSelectOption<WorkspaceExecutionHistoryFilterValue>[];

export const WORKSPACE_EXECUTION_HISTORY_SEARCH_FIELD_WEIGHTS = {
    fileName: 80,
    account: 60,
    executor: 50,
    port: 40,
    content: 20,
} as const satisfies Record<WorkspaceExecutionHistorySearchFieldName, number>;
