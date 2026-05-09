import { WORKSPACE_EXECUTION_HISTORY_SEARCH_FIELD_WEIGHTS } from "../../../constants/workspace/executionHistory";
import { searchItems } from "../../shared/search";
import type { SearchField } from "../../shared/search.type";
import type { WorkspaceExecutionHistoryEntry } from "../workspace.type";
import type {
    WorkspaceExecutionHistoryFilterValue,
    WorkspaceExecutionHistorySearchFieldName,
} from "./executionHistorySearch.type";

/**
 * Formats an executor kind enum value into a human-readable display label.
 *
 * @param executorKind - The raw executor kind
 * @returns A capitalized display string
 */
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

/**
 * Derives a display label for the account associated with an execution history entry.
 *
 * Prefers the display name, then the raw account ID, then fallback labels for unknown or unbound accounts.
 *
 * @param entry - The execution history entry (or a subset with account fields)
 * @returns A human-readable account label
 */
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

/**
 * Checks whether an execution history entry matches the given executor kind filter.
 *
 * @param entry - The entry to test
 * @param filterValue - The active filter, or "all" to match everything
 * @returns True if the entry passes the filter
 */
export function matchesWorkspaceExecutionHistoryFilters(
    entry: WorkspaceExecutionHistoryEntry,
    filterValue: WorkspaceExecutionHistoryFilterValue,
): boolean {
    if (filterValue === "all") {
        return true;
    }

    return entry.executorKind === filterValue;
}

/**
 * Searches execution history entries by query, ranking results by weighted field matches.
 *
 * @param entries - The entries to search
 * @param query - The search query string
 * @returns Entries sorted by relevance to the query
 */
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

/**
 * Applies filter and search to execution history entries, returning the visible subset.
 *
 * @param entries - All execution history entries
 * @param options.filterValue - Active executor kind filter
 * @param options.query - Search query string
 * @returns Filtered and ranked entries ready for display
 */
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
