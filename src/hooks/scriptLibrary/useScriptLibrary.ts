import { useEffect } from "react";
import { useDebouncedValue } from "../shared/useDebouncedValue";
import type { UseScriptLibraryResult } from "./useScriptLibrary.type";
import {
    selectHasActiveScriptLibraryFilters,
    useScriptLibraryStore,
} from "./useScriptLibraryStore";

export function useScriptLibrary(): UseScriptLibraryResult {
    const query = useScriptLibraryStore((state) => state.query);
    const page = useScriptLibraryStore((state) => state.page);
    const filters = useScriptLibraryStore((state) => state.filters);
    const orderBy = useScriptLibraryStore((state) => state.orderBy);
    const viewFormat = useScriptLibraryStore((state) => state.viewFormat);
    const scripts = useScriptLibraryStore((state) => state.scripts);
    const isLoading = useScriptLibraryStore((state) => state.isLoading);
    const errorMessage = useScriptLibraryStore((state) => state.errorMessage);
    const canGoNext = useScriptLibraryStore((state) => state.canGoNext);
    const maxPages = useScriptLibraryStore((state) => state.maxPages);
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
    const setQuery = useScriptLibraryStore((state) => state.setQuery);
    const toggleFilter = useScriptLibraryStore((state) => state.toggleFilter);
    const setOrderBy = useScriptLibraryStore((state) => state.setOrderBy);
    const setViewFormat = useScriptLibraryStore((state) => state.setViewFormat);
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
    const debouncedQuery = useDebouncedValue(query, 400);

    useEffect(() => {
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
    }, [debouncedQuery, filters, loadScripts, orderBy, page]);

    return {
        state: {
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
            hasActiveFilters,
        },
        activity: {
            copyingScriptFor,
            addingScriptFor,
            copiedLinkId,
            copiedScriptId,
            addedScriptId,
        },
        actions: {
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
        },
    };
}
