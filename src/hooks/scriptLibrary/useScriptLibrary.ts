import { useEffect } from "react";
import type {
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
    ScriptLibraryViewFormat,
} from "../../lib/scriptLibrary/scriptLibrary.type";
import { useDebouncedValue } from "../shared/useDebouncedValue";
import {
    selectHasActiveScriptLibraryFilters,
    useScriptLibraryStore,
} from "./useScriptLibraryStore";

type UseScriptLibraryResult = {
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
    hasActiveFilters: boolean;
    copyingScriptFor: string | null;
    addingScriptFor: string | null;
    copiedLinkId: string | null;
    copiedScriptId: string | null;
    addedScriptId: string | null;
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
};

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
    };
}
