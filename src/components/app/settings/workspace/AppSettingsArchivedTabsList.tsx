import { Delete02Icon, DeletePutBackIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import type { WorkspaceTabState } from "../../../../types/workspace/workspace";
import { AppIcon } from "../../AppIcon";

type ArchivedTabActionButtonClassNames = {
    base: string;
    delete: string;
};

type AppSettingsArchivedTabsListProps = {
    archivedTabs: WorkspaceTabState[];
    actionButtonClassNames: ArchivedTabActionButtonClassNames;
    dateFormatter: Intl.DateTimeFormat;
    onDeleteTab: (tabId: string) => void;
    onRestoreTab: (tabId: string) => void;
};

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
                <div
                    key={tab.id}
                    className="flex items-center justify-between gap-3 rounded-[0.85rem] border border-fumi-200 bg-fumi-50 px-3 py-2.5"
                >
                    <div className="min-w-0 flex flex-col gap-0.5">
                        <p className="truncate text-[0.8125rem] font-semibold text-fumi-900">
                            {tab.fileName}
                        </p>
                        <p className="truncate text-[0.65rem] font-medium text-fumi-400">
                            {tab.archivedAt
                                ? `Archived on ${dateFormatter.format(tab.archivedAt)}`
                                : "Unknown Date"}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onRestoreTab(tab.id)}
                            className={actionButtonClassNames.base}
                        >
                            <AppIcon
                                icon={DeletePutBackIcon}
                                size={12}
                                strokeWidth={2.4}
                            />
                            Restore
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteTab(tab.id)}
                            className={actionButtonClassNames.delete}
                        >
                            <AppIcon
                                icon={Delete02Icon}
                                size={12}
                                strokeWidth={2.4}
                            />
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
