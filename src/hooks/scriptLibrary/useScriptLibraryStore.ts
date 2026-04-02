import { Effect } from "effect";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_SCRIPT_LIBRARY_FILTERS } from "../../constants/scriptLibrary/scriptLibrary";
import {
    createScriptLibraryCachedSession,
    fetchFilteredScriptsPageEffect,
    fetchScriptsPageEffect,
    getScriptLibrarySessionKey,
    hasActiveScriptLibraryFilters,
    type ScriptLibraryCachedSession,
} from "../../lib/scriptLibrary/api";
import type {
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
    ScriptLibraryViewFormat,
} from "../../lib/scriptLibrary/scriptLibrary.type";
import { runPromise } from "../../lib/shared/effectRuntime";
import { getErrorMessage } from "../../lib/shared/errorMessage";

type ScriptLibraryStoreState = {
    query: string;
    page: number;
    filters: ScriptLibraryFilters;
    orderBy: ScriptLibrarySort;
    viewFormat: ScriptLibraryViewFormat;
    scripts: ScriptLibraryEntry[];
    isLoading: boolean;
    errorMessage: string | null;
    canGoNext: boolean;
    maxPages: number | null;
    copyingScriptFor: string | null;
    addingScriptFor: string | null;
    copiedLinkId: string | null;
    copiedScriptId: string | null;
    addedScriptId: string | null;
};

type ScriptLibraryStoreActions = {
    setQuery: (query: string) => void;
    toggleFilter: (filterKey: keyof ScriptLibraryFilters) => void;
    setOrderBy: (orderBy: ScriptLibrarySort) => void;
    setViewFormat: (viewFormat: ScriptLibraryViewFormat) => void;
    goToPreviousPage: () => void;
    goToNextPage: () => void;
    setCopyingScriptFor: (scriptId: string | null) => void;
    setAddingScriptFor: (scriptId: string | null) => void;
    activateCopiedLink: (scriptId: string) => void;
    activateCopiedScript: (scriptId: string) => void;
    activateAddedScript: (scriptId: string) => void;
    loadScripts: (options: {
        query: string;
        page: number;
        filters: ScriptLibraryFilters;
        orderBy: ScriptLibrarySort;
        signal: AbortSignal;
    }) => Promise<void>;
};

type ScriptLibraryStore = ScriptLibraryStoreState & ScriptLibraryStoreActions;

const ACTION_FEEDBACK_DURATION_MS = 2000;

const scriptLibrarySessionCache = new Map<string, ScriptLibraryCachedSession>();

let copiedLinkTimer: number | null = null;
let copiedScriptTimer: number | null = null;
let addedScriptTimer: number | null = null;

function clearTimer(timerId: number | null): void {
    if (timerId !== null) {
        window.clearTimeout(timerId);
    }
}

function getScriptLibrarySession(
    query: string,
    orderBy: ScriptLibrarySort,
): ScriptLibraryCachedSession {
    const sessionKey = getScriptLibrarySessionKey(query, orderBy);
    const existingSession = scriptLibrarySessionCache.get(sessionKey);

    if (existingSession) {
        return existingSession;
    }

    const nextSession = createScriptLibraryCachedSession();

    scriptLibrarySessionCache.set(sessionKey, nextSession);

    return nextSession;
}

export const selectHasActiveScriptLibraryFilters = (
    state: ScriptLibraryStore,
): boolean => hasActiveScriptLibraryFilters(state.filters);

export const useScriptLibraryStore = create<ScriptLibraryStore>()(
    persist(
        (set) => ({
            query: "",
            page: 1,
            filters: DEFAULT_SCRIPT_LIBRARY_FILTERS,
            orderBy: "date",
            viewFormat: "grid",
            scripts: [],
            isLoading: true,
            errorMessage: null,
            canGoNext: false,
            maxPages: null,
            copyingScriptFor: null,
            addingScriptFor: null,
            copiedLinkId: null,
            copiedScriptId: null,
            addedScriptId: null,
            setQuery: (query) => {
                set({
                    query,
                    page: 1,
                });
            },
            toggleFilter: (filterKey) => {
                set((state) => ({
                    filters: {
                        ...state.filters,
                        [filterKey]: !state.filters[filterKey],
                    },
                    page: 1,
                }));
            },
            setOrderBy: (orderBy) => {
                set({
                    orderBy,
                    page: 1,
                });
            },
            setViewFormat: (viewFormat) => {
                set({ viewFormat });
            },
            goToPreviousPage: () => {
                set((state) => ({
                    page: Math.max(1, state.page - 1),
                }));
            },
            goToNextPage: () => {
                set((state) => ({
                    page: state.page + 1,
                }));
            },
            setCopyingScriptFor: (copyingScriptFor) => {
                set({ copyingScriptFor });
            },
            setAddingScriptFor: (addingScriptFor) => {
                set({ addingScriptFor });
            },
            activateCopiedLink: (scriptId) => {
                clearTimer(copiedLinkTimer);
                set({ copiedLinkId: scriptId });
                copiedLinkTimer = window.setTimeout(() => {
                    set((state) => ({
                        copiedLinkId:
                            state.copiedLinkId === scriptId
                                ? null
                                : state.copiedLinkId,
                    }));
                    copiedLinkTimer = null;
                }, ACTION_FEEDBACK_DURATION_MS);
            },
            activateCopiedScript: (scriptId) => {
                clearTimer(copiedScriptTimer);
                set({ copiedScriptId: scriptId });
                copiedScriptTimer = window.setTimeout(() => {
                    set((state) => ({
                        copiedScriptId:
                            state.copiedScriptId === scriptId
                                ? null
                                : state.copiedScriptId,
                    }));
                    copiedScriptTimer = null;
                }, ACTION_FEEDBACK_DURATION_MS);
            },
            activateAddedScript: (scriptId) => {
                clearTimer(addedScriptTimer);
                set({ addedScriptId: scriptId });
                addedScriptTimer = window.setTimeout(() => {
                    set((state) => ({
                        addedScriptId:
                            state.addedScriptId === scriptId
                                ? null
                                : state.addedScriptId,
                    }));
                    addedScriptTimer = null;
                }, ACTION_FEEDBACK_DURATION_MS);
            },
            loadScripts: async ({
                query,
                page,
                filters,
                orderBy,
                signal,
            }): Promise<void> => {
                const trimmedQuery = query.trim();
                const hasActiveFilters = hasActiveScriptLibraryFilters(filters);
                const session = getScriptLibrarySession(trimmedQuery, orderBy);

                set({
                    isLoading: true,
                    errorMessage: null,
                });

                const program = (
                    hasActiveFilters
                        ? fetchFilteredScriptsPageEffect(
                              session,
                              trimmedQuery,
                              page,
                              filters,
                              orderBy,
                              signal,
                          ).pipe(
                              Effect.map((filteredResult) => ({
                                  scripts: filteredResult.scripts,
                                  canGoNext: filteredResult.canGoNext,
                                  maxPages: filteredResult.maxPages,
                              })),
                          )
                        : fetchScriptsPageEffect(
                              session,
                              trimmedQuery,
                              page,
                              orderBy,
                              signal,
                          ).pipe(
                              Effect.map((scriptsPage) => ({
                                  scripts: scriptsPage.scripts,
                                  canGoNext: page < scriptsPage.maxPages,
                                  maxPages: scriptsPage.maxPages,
                              })),
                          )
                ).pipe(
                    Effect.match({
                        onSuccess: (result) => {
                            if (signal.aborted) {
                                return;
                            }

                            set({
                                scripts: result.scripts,
                                canGoNext: result.canGoNext,
                                maxPages: result.maxPages,
                                isLoading: false,
                            });
                        },
                        onFailure: (error) => {
                            if (signal.aborted) {
                                return;
                            }

                            set({
                                scripts: [],
                                canGoNext: false,
                                maxPages: null,
                                errorMessage: getErrorMessage(
                                    error,
                                    "Could not load script library.",
                                    {
                                        useFallbackForAbort: true,
                                    },
                                ),
                                isLoading: false,
                            });
                        },
                    }),
                );

                await runPromise(program);
            },
        }),
        {
            name: "fumi-script-library-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                filters: state.filters,
                orderBy: state.orderBy,
                viewFormat: state.viewFormat,
            }),
        },
    ),
);
