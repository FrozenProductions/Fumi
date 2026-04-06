import type { ReactElement } from "react";
import { SCRIPT_LIBRARY_SPINNER_MASK_STYLE } from "../../constants/scriptLibrary/screen";
import { useScriptLibrary } from "../../hooks/scriptLibrary/useScriptLibrary";
import { copyTextToClipboard } from "../../lib/platform/clipboard";
import {
    copyScriptToClipboard,
    fetchScriptText,
} from "../../lib/scriptLibrary/api";
import {
    getScriptLibraryPermalink,
    getWorkspaceScriptFileName,
} from "../../lib/scriptLibrary/scriptLibrary";
import type { ScriptLibraryEntry } from "../../lib/scriptLibrary/scriptLibrary.type";
import { ScriptLibraryCard } from "./ScriptLibraryCard";
import { ScriptLibraryToolbar } from "./ScriptLibraryToolbar";
import type { ScriptLibraryScreenProps } from "./scriptLibrary.type";

export function ScriptLibraryScreen({
    workspaceSession,
}: ScriptLibraryScreenProps): ReactElement {
    const hasWorkspace = Boolean(workspaceSession.workspace);
    const {
        query,
        page,
        filters,
        orderBy,
        viewFormat,
        scripts,
        isLoading,
        errorMessage,
        canGoNext,
        maxPages,
        copyingScriptFor,
        addingScriptFor,
        copiedLinkId,
        copiedScriptId,
        addedScriptId,
        setQuery,
        toggleFilter,
        setOrderBy,
        setViewFormat,
        goToPreviousPage,
        goToNextPage,
        setCopyingScriptFor,
        setAddingScriptFor,
        activateCopiedLink,
        activateCopiedScript,
        activateAddedScript,
    } = useScriptLibrary();

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
        if (!workspaceSession.workspace || addingScriptFor === script._id) {
            return;
        }

        setAddingScriptFor(script._id);

        try {
            const scriptText = await fetchScriptText(script);
            const didAdd = await workspaceSession.addWorkspaceScriptTab(
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

    return (
        <section className="flex h-full min-h-0 flex-col bg-fumi-50">
            <ScriptLibraryToolbar
                query={query}
                filters={filters}
                orderBy={orderBy}
                viewFormat={viewFormat}
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
                    <div className="flex flex-1 items-center justify-center">
                        <div className="max-w-md rounded-[1.35rem] border border-fumi-200 bg-fumi-50 px-7 py-8 text-center shadow-[var(--shadow-app-card)]">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-red-500">
                                Fetch Error
                            </p>
                            <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-fumi-900">
                                Something went wrong
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-fumi-400">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                ) : scripts.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="max-w-md text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                                No Results
                            </p>
                            <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-fumi-900">
                                Cannot find any scripts
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-fumi-400">
                                Try adjusting your search or filters to find
                                what you are looking for.
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
                        {scripts.map((script) => (
                            <ScriptLibraryCard
                                key={script._id}
                                script={script}
                                viewFormat={viewFormat}
                                actions={{
                                    hasWorkspace,
                                    isAddingToWorkspace:
                                        addingScriptFor === script._id,
                                    isAddedToWorkspace:
                                        addedScriptId === script._id,
                                    isCopyingScript:
                                        copyingScriptFor === script._id,
                                    isCopiedLink: copiedLinkId === script._id,
                                    isCopiedScript:
                                        copiedScriptId === script._id,
                                    onAddToWorkspace: () => {
                                        void handleAddToWorkspace(script);
                                    },
                                    onCopyLink: () => {
                                        void handleCopyLink(script);
                                    },
                                    onCopyScript: () => {
                                        void handleCopyScript(script);
                                    },
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-fumi-200 bg-fumi-50 px-4 py-3">
                <p className="text-[11px] font-semibold text-fumi-400">
                    Powered by Rscripts.net
                </p>
                {!isLoading && !errorMessage && scripts.length > 0 ? (
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
                ) : null}
            </div>
        </section>
    );
}
