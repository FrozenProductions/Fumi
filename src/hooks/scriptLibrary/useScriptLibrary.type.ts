import type {
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
    ScriptLibraryViewFormat,
} from "../../lib/scriptLibrary/scriptLibrary.type";

export type UseScriptLibraryResult = {
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
