import type { ReactElement } from "react";
import { AppSettingsArchivedTabRow } from "./AppSettingsArchivedTabRow";
import type { AppSettingsArchivedTabsListProps } from "./appSettingsWorkspace.type";

/**
 * Renders the list of archived workspace tabs with restore and delete actions.
 *
 * @param props - Component props
 */
export function AppSettingsArchivedTabsList({
    archivedTabs,
    actionButtonClassNames,
    dateFormatter,
    onDeleteTab,
    onRestoreTab,
}: AppSettingsArchivedTabsListProps): ReactElement {
    if (archivedTabs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-semibold text-fumi-500">
                    No matches found
                </p>
                <p className="mt-1 text-xs text-fumi-400">
                    Try adjusting your search query.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {archivedTabs.map((tab) => (
                <AppSettingsArchivedTabRow
                    key={tab.id}
                    actionButtonClassNames={actionButtonClassNames}
                    dateFormatter={dateFormatter}
                    tab={tab}
                    onDeleteTab={onDeleteTab}
                    onRestoreTab={onRestoreTab}
                />
            ))}
        </div>
    );
}
