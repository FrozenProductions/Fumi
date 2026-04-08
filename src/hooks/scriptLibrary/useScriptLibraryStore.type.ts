import type {
    ScriptLibraryContentMode,
    ScriptLibraryEntry,
    ScriptLibraryFavoriteEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
    ScriptLibraryViewFormat,
} from "../../lib/scriptLibrary/scriptLibrary.type";

export type ScriptLibraryStoreState = {
    contentMode: ScriptLibraryContentMode;
    query: string;
    page: number;
    filters: ScriptLibraryFilters;
    orderBy: ScriptLibrarySort;
    viewFormat: ScriptLibraryViewFormat;
    favoriteScripts: ScriptLibraryFavoriteEntry[];
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
    setContentMode: (contentMode: ScriptLibraryContentMode) => void;
    setQuery: (query: string) => void;
    toggleFilter: (filterKey: keyof ScriptLibraryFilters) => void;
    setOrderBy: (orderBy: ScriptLibrarySort) => void;
    setViewFormat: (viewFormat: ScriptLibraryViewFormat) => void;
    toggleFavorite: (script: ScriptLibraryEntry) => void;
    removeFavorite: (scriptId: string) => void;
    clearFavorites: () => void;
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

export type ScriptLibraryViewState = Pick<
    ScriptLibraryStore,
    | "canGoNext"
    | "contentMode"
    | "errorMessage"
    | "favoriteScripts"
    | "filters"
    | "isLoading"
    | "maxPages"
    | "orderBy"
    | "page"
    | "query"
    | "scripts"
    | "viewFormat"
>;

export type ScriptLibraryActivityState = Pick<
    ScriptLibraryStore,
    | "addedScriptId"
    | "addingScriptFor"
    | "copiedLinkId"
    | "copiedScriptId"
    | "copyingScriptFor"
>;

export type ScriptLibraryViewActions = Pick<
    ScriptLibraryStore,
    | "activateAddedScript"
    | "activateCopiedLink"
    | "activateCopiedScript"
    | "clearFavorites"
    | "goToNextPage"
    | "goToPreviousPage"
    | "removeFavorite"
    | "setAddingScriptFor"
    | "setContentMode"
    | "setCopyingScriptFor"
    | "setOrderBy"
    | "setQuery"
    | "setViewFormat"
    | "toggleFavorite"
    | "toggleFilter"
>;
