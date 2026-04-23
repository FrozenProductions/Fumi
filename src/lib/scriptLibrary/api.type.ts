import type { ScriptLibraryEntry } from "./scriptLibrary.type";

export type ScriptLibraryPage = {
    scripts: ScriptLibraryEntry[];
    currentPage: number;
    maxPages: number;
};

export type ScriptLibraryFilteredCache = {
    filteredScripts: ScriptLibraryEntry[];
    isSourceExhausted: boolean;
    maxSourcePages: number | null;
    nextSourcePage: number;
};

export type ScriptLibraryCachedSession = {
    filteredResults: Map<string, ScriptLibraryFilteredCache>;
    pages: Map<number, ScriptLibraryPage>;
    maxPages: number | null;
};
