import { WORKSPACE_EXECUTION_HISTORY_SEARCH_FIELD_WEIGHTS } from "../../../constants/workspace/executionHistory";
import { searchItems } from "../../shared/search";
import type { SearchField } from "../../shared/search.type";
import type { WorkspaceExecutionHistoryEntry } from "../workspace.type";
import type {
    WorkspaceExecutionHistoryFilterValue,
    WorkspaceExecutionHistorySearchFieldName,
} from "./executionHistorySearch.type";

export function formatWorkspaceExecutionHistoryExecutorKind(
    executorKind: WorkspaceExecutionHistoryEntry["executorKind"],
): string {
    switch (executorKind) {
        case "macsploit":
            return "Macsploit";
        case "opiumware":
            return "OpiumWare";
        default:
            return "Unsupported";
    }
}

export function getWorkspaceExecutionHistoryAccountLabel(
    entry: Pick<
        WorkspaceExecutionHistoryEntry,
        "accountDisplayName" | "accountId" | "isBoundToUnknownAccount"
    >,
): string {
    if (entry.accountDisplayName) {
        return entry.accountDisplayName;
    }

    if (entry.accountId) {
        return entry.accountId;
    }

    if (entry.isBoundToUnknownAccount) {
        return "Unknown bound account";
    }

    return "No account bound";
}

export function matchesWorkspaceExecutionHistoryFilters(
    entry: WorkspaceExecutionHistoryEntry,
    filterValue: WorkspaceExecutionHistoryFilterValue,
): boolean {
    if (filterValue === "all") {
        return true;
    }

    return entry.executorKind === filterValue;
}

export function searchWorkspaceExecutionHistoryEntries(
    entries: readonly WorkspaceExecutionHistoryEntry[],
    query: string,
): WorkspaceExecutionHistoryEntry[] {
    return searchItems(
        [...entries],
        query,
        entries.length,
        getWorkspaceExecutionHistorySearchFields,
        WORKSPACE_EXECUTION_HISTORY_SEARCH_FIELD_WEIGHTS,
    );
}

export function getVisibleWorkspaceExecutionHistoryEntries(
    entries: readonly WorkspaceExecutionHistoryEntry[],
    options: {
        filterValue: WorkspaceExecutionHistoryFilterValue;
        query: string;
    },
): WorkspaceExecutionHistoryEntry[] {
    const filteredEntries = entries.filter((entry) =>
        matchesWorkspaceExecutionHistoryFilters(entry, options.filterValue),
    );

    return searchWorkspaceExecutionHistoryEntries(
        filteredEntries,
        options.query,
    );
}

function getWorkspaceExecutionHistorySearchFields(
    entry: WorkspaceExecutionHistoryEntry,
): SearchField<WorkspaceExecutionHistorySearchFieldName>[] {
    return [
        { name: "fileName", value: entry.fileName },
        { name: "content", value: entry.scriptContent },
        {
            name: "executor",
            value: formatWorkspaceExecutionHistoryExecutorKind(
                entry.executorKind,
            ),
        },
        { name: "port", value: String(entry.port) },
        {
            name: "account",
            value: getWorkspaceExecutionHistoryAccountLabel(entry),
        },
    ];
}
