import type { ScriptLibraryEntry } from "./scriptLibrary.type";

export type ScriptLibraryPage = {
    scripts: ScriptLibraryEntry[];
    currentPage: number;
    maxPages: number;
};

export type ScriptLibraryCachedSession = {
    pages: Map<number, ScriptLibraryPage>;
    maxPages: number | null;
};
