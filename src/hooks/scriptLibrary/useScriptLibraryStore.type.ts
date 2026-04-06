import type {
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
    ScriptLibraryViewFormat,
} from "../../lib/scriptLibrary/scriptLibrary.type";

export type ScriptLibraryStoreState = {
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

export type ScriptLibraryStoreActions = {
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

export type ScriptLibraryStore = ScriptLibraryStoreState &
    ScriptLibraryStoreActions;
