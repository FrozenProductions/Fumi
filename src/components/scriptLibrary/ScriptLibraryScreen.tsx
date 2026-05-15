import type { ReactElement } from "react";
import nothingFoundIcon from "../../assets/icons/nothing_found.svg";
import warningIcon from "../../assets/icons/warning.svg";
import { SCRIPT_LIBRARY_SPINNER_MASK_STYLE } from "../../constants/scriptLibrary/screen";
import { useScriptLibrary } from "../../hooks/scriptLibrary/useScriptLibrary";
import { useScriptLibraryCardActions } from "../../hooks/scriptLibrary/useScriptLibraryCardActions";
import { useWorkspaceSession } from "../../hooks/workspace/useWorkspaceSession";
import type { ScriptLibraryContentMode } from "../../lib/scriptLibrary/scriptLibrary.type";
import { createMaskStyle } from "../../lib/shared/mask";
import { ScriptLibraryCard } from "./ScriptLibraryCard";
import { ScriptLibraryToolbar } from "./ScriptLibraryToolbar";
import type { ScriptLibraryEmptyState } from "./scriptLibrary.type";

function getScriptLibraryEmptyState(options: {
    contentMode: ScriptLibraryContentMode;
    favoriteCount: number;
}): ScriptLibraryEmptyState {
    if (options.contentMode === "favorites" && options.favoriteCount === 0) {
        return {
            eyebrow: "No Favorites",
            title: "Save scripts you want to keep close",
            description:
                "Star any script from the library to keep a local favorites list you can revisit anytime.",
        };
    }

    if (options.contentMode === "favorites") {
        return {
            eyebrow: "No Matching Favorites",
            title: "No saved scripts match this view",
            description:
                "Try adjusting your search or filters, or go back to the full library to discover more scripts.",
        };
    }

    return {
        eyebrow: "No Results",
        title: "Cannot find any scripts",
        description:
            "Try adjusting your search or filters to find what you are looking for.",
    };
}

const WARNING_ICON_STYLE = createMaskStyle(warningIcon);
const NOTHING_FOUND_ICON_STYLE = createMaskStyle(nothingFoundIcon);

/**
 * The main script library screen for browsing and managing scripts.
 *
 * @param props - Component props
 * @param props.workspaceSession - Current workspace session
 * @returns A React component
 */
export function ScriptLibraryScreen(): ReactElement {
    const workspaceSession = useWorkspaceSession();
    const hasWorkspace = Boolean(workspaceSession.state.workspace);
    const { activity, actions, state } = useScriptLibrary();
    const {
        contentMode,
        query,
        page,
        filters,
        orderBy,
        viewFormat,
        favoriteCount,
        favoriteIds,
        scripts,
        isLoading,
        errorMessage,
        canGoNext,
        maxPages,
    } = state;
    const {
        clearFavorites,
        setContentMode,
        setQuery,
        toggleFilter,
        setOrderBy,
        setViewFormat,
        toggleFavorite,
        goToPreviousPage,
        goToNextPage,
        setCopyingScriptFor,
        setAddingScriptFor,
        activateCopiedLink,
        activateCopiedScript,
        activateAddedScript,
    } = actions;
    const { createCardActions } = useScriptLibraryCardActions({
        activity,
        actions: {
            activateAddedScript,
            activateCopiedLink,
            activateCopiedScript,
            setAddingScriptFor,
            setCopyingScriptFor,
            toggleFavorite,
        },
        favoriteIds,
        hasWorkspace,
        workspaceSession,
    });
    const emptyState = getScriptLibraryEmptyState({
        contentMode,
        favoriteCount,
    });

    return (
        <section className="flex h-full min-h-0 flex-col bg-fumi-50">
            <ScriptLibraryToolbar
                contentMode={contentMode}
                favoriteCount={favoriteCount}
                query={query}
                filters={filters}
                orderBy={orderBy}
                viewFormat={viewFormat}
                onClearFavorites={clearFavorites}
                onContentModeChange={setContentMode}
                onQueryChange={setQuery}
                onToggleFilter={toggleFilter}
                onOrderByChange={setOrderBy}
                onViewFormatChange={setViewFormat}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-fumi-50/30 p-4 [&::-webkit-scrollbar-thumb:hover]:bg-[rgb(var(--color-scrollbar-thumb-hover)/1)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[rgb(var(--color-scrollbar-thumb)/1)] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar]:w-[6px]">
                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div
                                className="size-8 animate-spin bg-fumi-500"
                                style={SCRIPT_LIBRARY_SPINNER_MASK_STYLE}
                            />
                            <h3 className="animate-pulse text-sm font-semibold text-fumi-500">
                                Loading scripts…
                            </h3>
                        </div>
                    </div>
                ) : errorMessage ? (
                    <div className="flex flex-1 items-center justify-center p-8">
                        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                            <div
                                aria-hidden="true"
                                className="mx-auto size-24 bg-fumi-600"
                                style={WARNING_ICON_STYLE}
                            />
                            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                                Fetch Error
                            </p>
                            <p className="mt-4 text-sm leading-6 text-fumi-400">
                                Fumi could not reach the script source right
                                now. Check your connection, then try again in a
                                moment.
                            </p>
                        </div>
                    </div>
                ) : scripts.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center p-8">
                        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                            <div
                                aria-hidden="true"
                                className="mx-auto size-24 bg-fumi-600"
                                style={NOTHING_FOUND_ICON_STYLE}
                            />
                            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                                {emptyState.eyebrow}
                            </p>
                            <p className="mt-4 text-sm leading-6 text-fumi-400">
                                {emptyState.description}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div
                        className={
                            viewFormat === "grid"
                                ? "grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
                                : "flex flex-col gap-3"
                        }
                    >
                        {scripts.map((script) => {
                            const actions = createCardActions(script);

                            return (
                                <ScriptLibraryCard
                                    key={script._id}
                                    script={script}
                                    viewFormat={viewFormat}
                                    actions={actions}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex min-h-[3.625rem] shrink-0 items-center justify-between border-t border-fumi-200 bg-fumi-50 px-4 py-3">
                <p className="text-[11px] font-semibold text-fumi-400">
                    {contentMode === "favorites"
                        ? `${favoriteCount} saved favorite${favoriteCount === 1 ? "" : "s"}`
                        : "Powered by Rscripts.net"}
                </p>
                {contentMode === "browse" &&
                !isLoading &&
                !errorMessage &&
                scripts.length > 0 ? (
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            disabled={page === 1}
                            onClick={goToPreviousPage}
                            className="app-select-none inline-flex h-8 items-center justify-center rounded-[0.65rem] border border-fumi-200 bg-fumi-50 px-3 text-xs font-semibold text-fumi-600 transition-colors hover:bg-fumi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:pointer-events-none disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="app-select-none text-xs font-semibold text-fumi-400">
                            Page {page}
                            {maxPages !== null ? ` of ${maxPages}` : ""}
                        </span>
                        <button
                            type="button"
                            disabled={!canGoNext}
                            onClick={goToNextPage}
                            className="app-select-none inline-flex h-8 items-center justify-center rounded-[0.65rem] border border-fumi-200 bg-fumi-50 px-3 text-xs font-semibold text-fumi-600 transition-colors hover:bg-fumi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:pointer-events-none disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                ) : (
                    <div className="h-8" aria-hidden="true" />
                )}
            </div>
        </section>
    );
}
