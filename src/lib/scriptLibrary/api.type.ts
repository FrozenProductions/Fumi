import type { ScriptLibraryEntry } from "../../lib/scriptLibrary/scriptLibrary.type";

export type ScriptLibraryPage = {
    scripts: ScriptLibraryEntry[];
    currentPage: number;
    maxPages: number;
};

export type ScriptLibraryCachedSession = {
    pages: Map<number, ScriptLibraryPage>;
    maxPages: number | null;
};
