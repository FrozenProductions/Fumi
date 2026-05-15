import {
    Delete02Icon,
    DeletePutBackIcon,
    Search01Icon,
} from "@hugeicons/core-free-icons";
import type { ChangeEvent, ReactElement } from "react";
import { useMemo, useState } from "react";
import {
    ARCHIVED_TABS_SENTINEL_STYLE,
    ARCHIVED_TABS_SORT_OPTIONS,
} from "../../../constants/workspace/archive";
import { useAppStore } from "../../../hooks/app/useAppStore";
import { useArchivedTabsSearchMinifier } from "../../../hooks/workspace/useArchivedTabsSearchMinifier";
import { useWorkspaceSession } from "../../../hooks/workspace/useWorkspaceSession";
import {
    createArchivedTabsDateFormatter,
    filterAndSortArchivedTabs,
} from "../../../lib/workspace/archive";
import type { ArchivedTabsSortOption } from "../../../lib/workspace/archive.type";
import { AppIcon } from "../common/AppIcon";
import { AppSelect } from "../form/AppSelect";
import { AppSettingsArchivedTabsList } from "./workspace/AppSettingsArchivedTabsList";
import { AppSettingsWorkspaceEmptyState } from "./workspace/AppSettingsWorkspaceEmptyState";
import type { ArchivedTabActionButtonClassNames } from "./workspace/appSettingsWorkspace.type";

/**
 * Manages the workspace settings section with archived tab search, sort, and bulk actions.
 */
export function AppSettingsWorkspaceSection(): ReactElement {
    const workspaceSession = useWorkspaceSession();
    const theme = useAppStore((state) => state.theme);
    const workspace = workspaceSession.state.workspace;
    const {
        deleteAllArchivedWorkspaceTabs,
        deleteArchivedWorkspaceTab,
        restoreAllArchivedWorkspaceTabs,
        restoreArchivedWorkspaceTab,
    } = workspaceSession.archiveActions;

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<ArchivedTabsSortOption>("dateDesc");

    const filteredAndSortedTabs = useMemo(() => {
        if (!workspace) {
            return [];
        }

        return filterAndSortArchivedTabs(
            workspace.archivedTabs,
            searchQuery,
            sortBy,
        );
    }, [workspace, searchQuery, sortBy]);

    const searchMinifier = useArchivedTabsSearchMinifier();

    const searchExitMotionClass = searchMinifier.isClosing
        ? "motion-safe:motion-opacity-out-0 motion-safe:-motion-translate-y-out-[10%] motion-safe:motion-duration-150"
        : "";

    const handleRestoreTab = (tabId: string): void => {
        void restoreArchivedWorkspaceTab(tabId);
    };

    const handleDeleteTab = (tabId: string): void => {
        void deleteArchivedWorkspaceTab(tabId);
    };

    const handleRestoreAll = (): void => {
        void restoreAllArchivedWorkspaceTabs();
    };

    const handleDeleteAll = (): void => {
        void deleteAllArchivedWorkspaceTabs();
    };

    const deleteButtonClass =
        theme === "dark"
            ? "app-select-none inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-rose-500/50 bg-rose-950/70 px-2.5 text-[11px] font-semibold text-rose-100 transition-[background-color,border-color,color] hover:border-rose-400 hover:bg-rose-900/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            : "app-select-none inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-700 transition-[background-color,border-color,color] hover:border-rose-300 hover:bg-rose-100 hover:text-rose-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";

    const baseActionButtonClass =
        "app-select-none inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-fumi-200 bg-fumi-100 px-2.5 text-[11px] font-semibold text-fumi-700 transition-[background-color,border-color,color] hover:border-fumi-300 hover:bg-fumi-200 hover:text-fumi-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600";

    const dateFormatter = createArchivedTabsDateFormatter();
    const actionButtonClassNames: ArchivedTabActionButtonClassNames = {
        base: baseActionButtonClass,
        delete: deleteButtonClass,
    };

    const handleSearchQueryChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setSearchQuery(event.target.value);
    };

    const handleSortByChange = (value: ArchivedTabsSortOption): void => {
        setSortBy(value);
    };

    if (!workspace) {
        return (
            <AppSettingsWorkspaceEmptyState
                title="No workspace open"
                description="Open a workspace to view and restore archived tabs."
            />
        );
    }

    if (workspace.archivedTabs.length === 0) {
        return (
            <AppSettingsWorkspaceEmptyState
                title="No archived tabs yet"
                description="When you archive a tab it will appear here. You can restore or permanently delete it at any time."
            />
        );
    }

    return (
        <div className="relative flex w-full flex-col gap-4">
            <div
                ref={searchMinifier.sentinelRef}
                className="pointer-events-none absolute left-0 h-[60px] w-full"
                style={ARCHIVED_TABS_SENTINEL_STYLE}
            />

            <div className="sticky top-0 z-30 -mx-6 -mt-6 bg-gradient-to-b from-fumi-50 from-[0%] via-fumi-50 via-[78%] to-fumi-50/0 px-6 pt-6 pb-2">
                <div
                    className={`flex flex-col rounded-[1rem] border border-fumi-200 bg-fumi-100/95 backdrop-blur-md transition-shadow ${
                        searchMinifier.isMinified ? "shadow-md" : "shadow-sm"
                    }`}
                >
                    <div
                        className={`relative z-20 grid transition-[grid-template-rows] duration-[150ms] ${
                            !searchMinifier.isMinified
                                ? "grid-rows-[1fr]"
                                : "grid-rows-[0fr]"
                        }`}
                    >
                        <div
                            className={
                                searchMinifier.isExpandedFully
                                    ? "overflow-visible"
                                    : "overflow-hidden"
                            }
                        >
                            {searchMinifier.isPresent ? (
                                <div
                                    ref={
                                        searchMinifier.handleSearchContainerRef
                                    }
                                    className={`flex items-center justify-between gap-4 border-b border-fumi-200/50 p-4 ${searchExitMotionClass}`}
                                >
                                    <div className="relative flex-1">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <AppIcon
                                                icon={Search01Icon}
                                                size={14}
                                                strokeWidth={2.4}
                                                className="text-fumi-400"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search archived tabs..."
                                            value={searchQuery}
                                            onChange={handleSearchQueryChange}
                                            className="h-8 w-full rounded-[0.65rem] border border-fumi-200 bg-fumi-50 pl-9 pr-3 text-xs font-semibold text-fumi-900 placeholder:text-fumi-400 transition-colors hover:border-fumi-300 focus-visible:border-fumi-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fumi-200"
                                        />
                                    </div>
                                    <AppSelect
                                        value={sortBy}
                                        onChange={handleSortByChange}
                                        options={ARCHIVED_TABS_SORT_OPTIONS}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div
                        className={`flex items-center justify-between px-4 transition-[padding] ${
                            searchMinifier.isMinified ? "py-2.5" : "py-2"
                        }`}
                    >
                        <p className="app-select-none text-xs font-semibold text-fumi-500">
                            {filteredAndSortedTabs.length} tab
                            {filteredAndSortedTabs.length !== 1 ? "s" : ""}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRestoreAll}
                                className={baseActionButtonClass}
                            >
                                <AppIcon
                                    icon={DeletePutBackIcon}
                                    size={12}
                                    strokeWidth={2.4}
                                />
                                Restore All
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAll}
                                className={deleteButtonClass}
                            >
                                <AppIcon
                                    icon={Delete02Icon}
                                    size={12}
                                    strokeWidth={2.4}
                                />
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AppSettingsArchivedTabsList
                archivedTabs={filteredAndSortedTabs}
                actionButtonClassNames={actionButtonClassNames}
                dateFormatter={dateFormatter}
                onDeleteTab={handleDeleteTab}
                onRestoreTab={handleRestoreTab}
            />
        </div>
    );
}
