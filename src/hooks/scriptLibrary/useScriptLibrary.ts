import { useEffect } from "react";
import { getVisibleScriptLibraryEntries } from "../../lib/scriptLibrary/scriptLibrary";
import { useDebouncedValue } from "../shared/useDebouncedValue";
import type { UseScriptLibraryResult } from "./useScriptLibrary.type";
import {
    selectFavoriteCount,
    selectHasActiveScriptLibraryFilters,
    useScriptLibraryStore,
} from "./useScriptLibraryStore";

/**
 * Provides access to script library state, favorites, pagination, and script management.
 *
 * @remarks
 * Supports browsing remote scripts or local favorites with filtering, sorting,
 * and search. Debounces query changes at 400ms before fetching remote results.
 */
export function useScriptLibrary(): UseScriptLibraryResult {
    const contentMode = useScriptLibraryStore((state) => state.contentMode);
    const query = useScriptLibraryStore((state) => state.query);
    const page = useScriptLibraryStore((state) => state.page);
    const filters = useScriptLibraryStore((state) => state.filters);
    const orderBy = useScriptLibraryStore((state) => state.orderBy);
    const viewFormat = useScriptLibraryStore((state) => state.viewFormat);
    const favoriteScripts = useScriptLibraryStore(
        (state) => state.favoriteScripts,
    );
    const remoteScripts = useScriptLibraryStore((state) => state.scripts);
    const remoteIsLoading = useScriptLibraryStore((state) => state.isLoading);
    const remoteErrorMessage = useScriptLibraryStore(
        (state) => state.errorMessage,
    );
    const remoteCanGoNext = useScriptLibraryStore((state) => state.canGoNext);
    const remoteMaxPages = useScriptLibraryStore((state) => state.maxPages);
    const copyingScriptFor = useScriptLibraryStore(
        (state) => state.copyingScriptFor,
    );
    const addingScriptFor = useScriptLibraryStore(
        (state) => state.addingScriptFor,
    );
    const copiedLinkId = useScriptLibraryStore((state) => state.copiedLinkId);
    const copiedScriptId = useScriptLibraryStore(
        (state) => state.copiedScriptId,
    );
    const addedScriptId = useScriptLibraryStore((state) => state.addedScriptId);
    const setContentMode = useScriptLibraryStore(
        (state) => state.setContentMode,
    );
    const setQuery = useScriptLibraryStore((state) => state.setQuery);
    const toggleFilter = useScriptLibraryStore((state) => state.toggleFilter);
    const setOrderBy = useScriptLibraryStore((state) => state.setOrderBy);
    const setViewFormat = useScriptLibraryStore((state) => state.setViewFormat);
    const toggleFavorite = useScriptLibraryStore(
        (state) => state.toggleFavorite,
    );
    const removeFavorite = useScriptLibraryStore(
        (state) => state.removeFavorite,
    );
    const clearFavorites = useScriptLibraryStore(
        (state) => state.clearFavorites,
    );
    const goToPreviousPage = useScriptLibraryStore(
        (state) => state.goToPreviousPage,
    );
    const goToNextPage = useScriptLibraryStore((state) => state.goToNextPage);
    const setCopyingScriptFor = useScriptLibraryStore(
        (state) => state.setCopyingScriptFor,
    );
    const setAddingScriptFor = useScriptLibraryStore(
        (state) => state.setAddingScriptFor,
    );
    const activateCopiedLink = useScriptLibraryStore(
        (state) => state.activateCopiedLink,
    );
    const activateCopiedScript = useScriptLibraryStore(
        (state) => state.activateCopiedScript,
    );
    const activateAddedScript = useScriptLibraryStore(
        (state) => state.activateAddedScript,
    );
    const loadScripts = useScriptLibraryStore((state) => state.loadScripts);
    const hasActiveFilters = useScriptLibraryStore(
        selectHasActiveScriptLibraryFilters,
    );
    const favoriteCount = useScriptLibraryStore(selectFavoriteCount);
    const debouncedQuery = useDebouncedValue(query, 400);
    const favoriteIds = new Set(
        favoriteScripts.map((favoriteScript) => favoriteScript._id),
    );
    const visibleFavoriteScripts = getVisibleScriptLibraryEntries(
        favoriteScripts,
        {
            query,
            filters,
            orderBy,
        },
    );
    const isFavoritesMode = contentMode === "favorites";
    const scripts = isFavoritesMode ? visibleFavoriteScripts : remoteScripts;
    const isLoading = isFavoritesMode ? false : remoteIsLoading;
    const errorMessage = isFavoritesMode ? null : remoteErrorMessage;
    const canGoNext = isFavoritesMode ? false : remoteCanGoNext;
    const maxPages = isFavoritesMode ? null : remoteMaxPages;

    useEffect(() => {
        if (isFavoritesMode) {
            return;
        }

        const controller = new AbortController();
        void loadScripts({
            query: debouncedQuery,
            page,
            filters,
            orderBy,
            signal: controller.signal,
        });

        return () => {
            controller.abort();
        };
    }, [debouncedQuery, filters, isFavoritesMode, loadScripts, orderBy, page]);

    return {
        state: {
            contentMode,
            query,
            page,
            filters,
            orderBy,
            viewFormat,
            favoriteScripts,
            scripts,
            isLoading,
            errorMessage,
            canGoNext,
            maxPages,
            hasActiveFilters,
            favoriteCount,
            favoriteIds,
        },
        activity: {
            copyingScriptFor,
            addingScriptFor,
            copiedLinkId,
            copiedScriptId,
            addedScriptId,
        },
        actions: {
            clearFavorites,
            setQuery,
            setContentMode,
            toggleFilter,
            setOrderBy,
            setViewFormat,
            toggleFavorite,
            removeFavorite,
            goToPreviousPage,
            goToNextPage,
            setCopyingScriptFor,
            setAddingScriptFor,
            activateCopiedLink,
            activateCopiedScript,
            activateAddedScript,
        },
    };
}
