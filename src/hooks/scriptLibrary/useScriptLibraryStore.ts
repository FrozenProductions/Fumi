import { create, type StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_SCRIPT_LIBRARY_FILTERS } from "../../constants/scriptLibrary/scriptLibrary";
import {
    createScriptLibraryCachedSession,
    fetchFilteredScriptsPage,
    fetchScriptsPage,
    getScriptLibrarySessionKey,
    hasActiveScriptLibraryFilters,
} from "../../lib/scriptLibrary/api";
import type { ScriptLibraryCachedSession } from "../../lib/scriptLibrary/api.type";
import { normalizeScriptLibraryFavoriteEntry } from "../../lib/scriptLibrary/scriptLibrary";
import type { ScriptLibrarySort } from "../../lib/scriptLibrary/scriptLibrary.type";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import type {
    ScriptLibraryStore,
    ScriptLibraryStoreState,
} from "./useScriptLibraryStore.type";

const ACTION_FEEDBACK_DURATION_MS = 2000;
export const SCRIPT_LIBRARY_STORE_STORAGE_KEY = "fumi-script-library-store";

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

export const selectFavoriteCount = (state: ScriptLibraryStore): number =>
    state.favoriteScripts.length;

export function getDefaultScriptLibraryStoreState(): ScriptLibraryStoreState {
    return {
        contentMode: "browse",
        query: "",
        page: 1,
        filters: DEFAULT_SCRIPT_LIBRARY_FILTERS,
        orderBy: "date",
        viewFormat: "grid",
        favoriteScripts: [],
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
    };
}

export function getPersistedScriptLibraryStoreState(
    state: ScriptLibraryStore,
): Pick<
    ScriptLibraryStoreState,
    "favoriteScripts" | "filters" | "orderBy" | "viewFormat"
> {
    return {
        filters: state.filters,
        favoriteScripts: state.favoriteScripts,
        orderBy: state.orderBy,
        viewFormat: state.viewFormat,
    };
}

export const createScriptLibraryStoreStateCreator: StateCreator<
    ScriptLibraryStore
> = (set) => ({
    ...getDefaultScriptLibraryStoreState(),
    setContentMode: (contentMode) => {
        set({ contentMode });
    },
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
    toggleFavorite: (script) => {
        set((state) => {
            const favoriteScriptIndex = state.favoriteScripts.findIndex(
                (favoriteScript) => favoriteScript._id === script._id,
            );

            if (favoriteScriptIndex >= 0) {
                return {
                    favoriteScripts: state.favoriteScripts.filter(
                        (favoriteScript) => favoriteScript._id !== script._id,
                    ),
                };
            }

            return {
                favoriteScripts: [
                    normalizeScriptLibraryFavoriteEntry(script),
                    ...state.favoriteScripts,
                ],
            };
        });
    },
    removeFavorite: (scriptId) => {
        set((state) => ({
            favoriteScripts: state.favoriteScripts.filter(
                (favoriteScript) => favoriteScript._id !== scriptId,
            ),
        }));
    },
    clearFavorites: () => {
        set({ favoriteScripts: [] });
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
                    state.copiedLinkId === scriptId ? null : state.copiedLinkId,
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

        try {
            if (hasActiveFilters) {
                const result = await fetchFilteredScriptsPage(
                    session,
                    trimmedQuery,
                    page,
                    filters,
                    orderBy,
                    signal,
                );

                if (signal.aborted) {
                    return;
                }

                set({
                    scripts: result.scripts,
                    canGoNext: result.canGoNext,
                    maxPages: result.maxPages,
                    isLoading: false,
                });
                return;
            }

            const result = await fetchScriptsPage(
                session,
                trimmedQuery,
                page,
                orderBy,
                signal,
            );

            if (signal.aborted) {
                return;
            }

            set({
                scripts: result.scripts,
                canGoNext: page < result.maxPages,
                maxPages: result.maxPages,
                isLoading: false,
            });
        } catch (error) {
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
        }
    },
});

export const useScriptLibraryStore = create<ScriptLibraryStore>()(
    persist(createScriptLibraryStoreStateCreator, {
        name: SCRIPT_LIBRARY_STORE_STORAGE_KEY,
        storage: createJSONStorage(() => globalThis.localStorage),
        partialize: getPersistedScriptLibraryStoreState,
    }),
);
