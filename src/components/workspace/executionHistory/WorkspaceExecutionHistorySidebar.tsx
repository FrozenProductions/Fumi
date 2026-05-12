import { Calendar01Icon, Key01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { memo } from "react";
import type { WorkspaceExecutionHistoryEntry } from "../../../lib/workspace/executionHistory/executionHistory.type";
import { AppIcon } from "../../app/common/AppIcon";
import type { WorkspaceExecutionHistorySidebarProps } from "./workspaceExecutionHistory.type";

const EXECUTION_HISTORY_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(
    undefined,
    {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    },
);

function formatExecutionTimestamp(executedAt: number): string {
    return EXECUTION_HISTORY_TIMESTAMP_FORMATTER.format(new Date(executedAt));
}

const WorkspaceExecutionHistorySidebarItem = memo(
    function WorkspaceExecutionHistorySidebarItem({
        entry,
        isSelected,
        onSelectEntry,
    }: {
        entry: WorkspaceExecutionHistoryEntry;
        isSelected: boolean;
        onSelectEntry: (entryId: string) => void;
    }): ReactElement {
        return (
            <button
                type="button"
                onClick={() => onSelectEntry(entry.id)}
                className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                    isSelected
                        ? "bg-fumi-100 text-fumi-900 shadow-sm ring-1 ring-fumi-200"
                        : "text-fumi-700 hover:bg-fumi-100/60"
                }`}
            >
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-semibold leading-tight">
                        {entry.fileName}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-fumi-500">
                        <span className="flex items-center gap-0.5">
                            <AppIcon
                                icon={Calendar01Icon}
                                size={9}
                                strokeWidth={2.5}
                            />
                            {formatExecutionTimestamp(entry.executedAt)}
                        </span>
                        <span className="flex items-center gap-0.5">
                            <AppIcon
                                icon={Key01Icon}
                                size={9}
                                strokeWidth={2.5}
                            />
                            {entry.port}
                        </span>
                    </div>
                </div>
            </button>
        );
    },
);

/**
 * Renders the selectable list of execution history entries in the modal sidebar.
 *
 * @param props - Component props
 */
export const WorkspaceExecutionHistorySidebar = memo(
    function WorkspaceExecutionHistorySidebar({
        entries,
        hasActiveSearch,
        selectedEntry,
        onSelectEntry,
    }: WorkspaceExecutionHistorySidebarProps): ReactElement {
        if (entries.length === 0) {
            return (
                <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6 text-center">
                    <p className="text-[10px] font-semibold text-fumi-500">
                        {hasActiveSearch
                            ? "No matching executions"
                            : "No executions yet"}
                    </p>
                </div>
            );
        }

        return (
            <div className="min-h-0 flex-1 overflow-y-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex flex-col gap-0.5">
                    {entries.map((entry) => {
                        const isSelected = entry.id === selectedEntry?.id;

                        return (
                            <WorkspaceExecutionHistorySidebarItem
                                key={entry.id}
                                entry={entry}
                                isSelected={isSelected}
                                onSelectEntry={onSelectEntry}
                            />
                        );
                    })}
                </div>
            </div>
        );
    },
);
