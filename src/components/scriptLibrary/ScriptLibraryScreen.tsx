import type { ReactElement } from "react";
import nothingFoundIcon from "../../assets/icons/nothing_found.svg";
import warningIcon from "../../assets/icons/warning.svg";
import { SCRIPT_LIBRARY_SPINNER_MASK_STYLE } from "../../constants/scriptLibrary/screen";
import { useScriptLibrary } from "../../hooks/scriptLibrary/useScriptLibrary";
import { useWorkspaceSession } from "../../hooks/workspace/useWorkspaceSession";
import { copyTextToClipboard } from "../../lib/platform/clipboard";
import {
    copyScriptToClipboard,
    fetchScriptText,
} from "../../lib/scriptLibrary/api";
import {
    getScriptLibraryPermalink,
    getWorkspaceScriptFileName,
} from "../../lib/scriptLibrary/scriptLibrary";
import type {
    ScriptLibraryContentMode,
    ScriptLibraryEntry,
} from "../../lib/scriptLibrary/scriptLibrary.type";
import { ScriptLibraryCard } from "./ScriptLibraryCard";
import { ScriptLibraryToolbar } from "./ScriptLibraryToolbar";
import type {
    ScriptLibraryCardActions,
    ScriptLibraryEmptyState,
} from "./scriptLibrary.type";

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
        copyingScriptFor,
        addingScriptFor,
        copiedLinkId,
        copiedScriptId,
        addedScriptId,
    } = activity;
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
    const emptyState = getScriptLibraryEmptyState({
        contentMode,
        favoriteCount,
    });

    async function handleCopyLink(script: ScriptLibraryEntry): Promise<void> {
        await copyTextToClipboard(getScriptLibraryPermalink(script));
        activateCopiedLink(script._id);
    }

    async function handleCopyScript(script: ScriptLibraryEntry): Promise<void> {
        if (copyingScriptFor === script._id) {
            return;
        }

        setCopyingScriptFor(script._id);

        try {
            await copyScriptToClipboard(script);
            activateCopiedScript(script._id);
        } catch (error) {
            console.error("Failed to copy script.", error);
        } finally {
            setCopyingScriptFor(null);
        }
    }

    async function handleAddToWorkspace(
        script: ScriptLibraryEntry,
    ): Promise<void> {
        if (
            !workspaceSession.state.workspace ||
            addingScriptFor === script._id
        ) {
            return;
        }

        setAddingScriptFor(script._id);

        try {
            const scriptText = await fetchScriptText(script);
            const didAdd =
                await workspaceSession.workspaceActions.addWorkspaceScriptTab(
                    getWorkspaceScriptFileName(script),
                    scriptText,
                );

            if (didAdd) {
                activateAddedScript(script._id);
            }
        } catch (error) {
            console.error("Failed to add script to workspace.", error);
        } finally {
            setAddingScriptFor(null);
        }
    }

    function createCardActions(
        script: ScriptLibraryEntry,
    ): ScriptLibraryCardActions {
        return {
            hasWorkspace,
            isAddingToWorkspace: addingScriptFor === script._id,
            isAddedToWorkspace: addedScriptId === script._id,
            isCopyingScript: copyingScriptFor === script._id,
            isCopiedLink: copiedLinkId === script._id,
            isCopiedScript: copiedScriptId === script._id,
            isFavorite: favoriteIds.has(script._id),
            onAddToWorkspace: () => {
                void handleAddToWorkspace(script);
            },
            onCopyLink: () => {
                void handleCopyLink(script);
            },
            onCopyScript: () => {
                void handleCopyScript(script);
            },
            onToggleFavorite: () => {
                toggleFavorite(script);
            },
        };
    }

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
                                Loading scripts...
                            </h3>
                        </div>
                    </div>
                ) : errorMessage ? (
                    <div className="flex flex-1 items-center justify-center p-8">
                        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                            <div
                                aria-hidden="true"
                                className="mx-auto h-24 w-24 bg-fumi-600"
                                style={{
                                    mask: `url("${warningIcon}") center / contain no-repeat`,
                                    WebkitMask: `url("${warningIcon}") center / contain no-repeat`,
                                }}
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
                                className="mx-auto h-24 w-24 bg-fumi-600"
                                style={{
                                    mask: `url("${nothingFoundIcon}") center / contain no-repeat`,
                                    WebkitMask: `url("${nothingFoundIcon}") center / contain no-repeat`,
                                }}
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
