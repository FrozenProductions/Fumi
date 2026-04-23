import type {
    ArchivedTabsSortOption,
    WorkspaceTabState,
} from "./workspace.type";

/**
 * Filters archived tabs by search query and sorts by name or date.
 */
export function filterAndSortArchivedTabs(
    archivedTabs: readonly WorkspaceTabState[],
    searchQuery: string,
    sortBy: ArchivedTabsSortOption,
): WorkspaceTabState[] {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchingTabs =
        normalizedQuery.length === 0
            ? archivedTabs
            : archivedTabs.filter((tab) =>
                  tab.fileName.toLowerCase().includes(normalizedQuery),
              );

    return [...matchingTabs].sort((leftTab, rightTab) => {
        if (sortBy.startsWith("name")) {
            const comparison = leftTab.fileName.localeCompare(
                rightTab.fileName,
            );

            return sortBy === "nameAsc" ? comparison : -comparison;
        }

        const leftArchivedAt = leftTab.archivedAt ?? 0;
        const rightArchivedAt = rightTab.archivedAt ?? 0;

        return sortBy === "dateDesc"
            ? rightArchivedAt - leftArchivedAt
            : leftArchivedAt - rightArchivedAt;
    });
}

/**
 * Creates a date formatter for archived tab timestamps.
 */
export function createArchivedTabsDateFormatter(): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}
