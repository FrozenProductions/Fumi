import { Delete02Icon, DeletePutBackIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { AppIcon } from "../../common/AppIcon";
import type { AppSettingsArchivedTabsListProps } from "./appSettingsWorkspace.type";

type AppSettingsArchivedTabRowProps = {
    actionButtonClassNames: AppSettingsArchivedTabsListProps["actionButtonClassNames"];
    dateFormatter: AppSettingsArchivedTabsListProps["dateFormatter"];
    tab: AppSettingsArchivedTabsListProps["archivedTabs"][number];
    onDeleteTab: AppSettingsArchivedTabsListProps["onDeleteTab"];
    onRestoreTab: AppSettingsArchivedTabsListProps["onRestoreTab"];
};

export function AppSettingsArchivedTabRow({
    actionButtonClassNames,
    dateFormatter,
    tab,
    onDeleteTab,
    onRestoreTab,
}: AppSettingsArchivedTabRowProps): ReactElement {
    return (
        <div className="flex items-center justify-between gap-3 rounded-[0.85rem] border border-fumi-200 bg-fumi-50 px-3 py-2.5">
            <div className="app-select-none min-w-0 flex flex-col gap-0.5">
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
                    <AppIcon icon={Delete02Icon} size={12} strokeWidth={2.4} />
                    Delete
                </button>
            </div>
        </div>
    );
}
