import type { ReactElement } from "react";
import { WORKSPACE_EXECUTION_HISTORY_FILTER_OPTIONS } from "../../../constants/workspace/executionHistory";
import { AppSearchField } from "../../app/form/AppSearchField";
import { AppSelect } from "../../app/form/AppSelect";
import type { WorkspaceExecutionHistoryToolbarProps } from "./workspaceExecutionHistory.type";

/**
 * Toolbar for searching and filtering execution history entries.
 */
export function WorkspaceExecutionHistoryToolbar({
    filterValue,
    query,
    onFilterChange,
    onQueryChange,
}: WorkspaceExecutionHistoryToolbarProps): ReactElement {
    return (
        <div className="flex shrink-0 items-center gap-2 border-b border-fumi-200 bg-fumi-100/50 px-3 py-2">
            <AppSearchField
                className="min-w-0 flex-1"
                value={query}
                onChange={onQueryChange}
                isClearable
                placeholder="Search history"
                ariaLabel="Search execution history"
                inputClassName="h-8 w-full min-w-0 rounded-[0.6rem] border border-fumi-200 bg-fumi-50 px-3 text-[11px] font-medium text-fumi-900 placeholder:text-fumi-400 outline-none transition-[border-color,box-shadow] focus:border-fumi-600 focus:ring-1 focus:ring-fumi-600"
                clearButtonClassName="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-fumi-400 transition-colors hover:text-fumi-700 focus-visible:outline-none"
            />
            <AppSelect
                className="shrink-0"
                value={filterValue}
                options={WORKSPACE_EXECUTION_HISTORY_FILTER_OPTIONS}
                onChange={onFilterChange}
            />
        </div>
    );
}
