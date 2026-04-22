import {
    RSCRIPTS_API_BASE_URL,
    SCRIPT_LIBRARY_PAGE_SIZE,
} from "../../constants/scriptLibrary/scriptLibrary";
import { copyTextToClipboard } from "../platform/clipboard";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import type { ScriptLibraryCachedSession, ScriptLibraryPage } from "./api.type";
import {
    getDetailRawScriptUrl,
    normalizeScript,
    parseRscriptsListResponse,
    parseRscriptsScriptDetailResponse,
    toPositiveNumber,
} from "./apiParsers";
import { fetchJsonResponse, fetchTextResponse } from "./apiTransport";
import { ScriptLibraryError } from "./errors";
import { matchesScriptLibraryFilters } from "./scriptLibrary";
import type {
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
} from "./scriptLibrary.type";

async function fetchRawScriptText(
    script: ScriptLibraryEntry,
    signal?: AbortSignal,
): Promise<string> {
    let rawScriptUrl = script.rawScript;

    if (!rawScriptUrl) {
        const detailData = await fetchJsonResponse(
            `${RSCRIPTS_API_BASE_URL}/script?id=${script._id}`,
            "fetchScriptDetail",
            parseRscriptsScriptDetailResponse,
            { signal },
        );

        rawScriptUrl = getDetailRawScriptUrl(detailData);
    }

    if (!rawScriptUrl) {
        throw new ScriptLibraryError({
            operation: "fetchScriptText",
            message: "Raw script URL is unavailable.",
        });
    }

    return fetchTextResponse(rawScriptUrl, "fetchRawScriptText", { signal });
}

export function createScriptLibraryCachedSession(): ScriptLibraryCachedSession {
    return {
        pages: new Map<number, ScriptLibraryPage>(),
        maxPages: null,
    };
}

export function getScriptLibrarySessionKey(
    query: string,
    orderBy: ScriptLibrarySort,
): string {
    return JSON.stringify({
        query: query.trim().toLowerCase(),
        orderBy,
    });
}

export function hasActiveScriptLibraryFilters(
    filters: ScriptLibraryFilters,
): boolean {
    return (
        filters.keyless || filters.free || filters.unpatched || filters.verified
    );
}

export async function fetchScriptsPage(
    session: ScriptLibraryCachedSession,
    query: string,
    page: number,
    orderBy: ScriptLibrarySort,
    signal: AbortSignal,
): Promise<ScriptLibraryPage> {
    const cachedPage = session.pages.get(page);

    if (cachedPage) {
        return cachedPage;
    }

    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("orderBy", orderBy);
    params.set("sort", "desc");

    if (query) {
        params.set("q", query);
    }

    const data = await fetchJsonResponse(
        `${RSCRIPTS_API_BASE_URL}/scripts?${params.toString()}`,
        "fetchScriptsPage",
        parseRscriptsListResponse,
        { signal },
    );
    const currentPage = toPositiveNumber(data.info?.currentPage, page);
    const maxPages = toPositiveNumber(data.info?.maxPages, currentPage);
    const normalizedPage = {
        scripts: Array.isArray(data.scripts)
            ? data.scripts.map(normalizeScript)
            : [],
        currentPage,
        maxPages,
    };

    session.pages.set(currentPage, normalizedPage);
    session.maxPages = maxPages;

    return normalizedPage;
}

export async function fetchFilteredScriptsPage(
    session: ScriptLibraryCachedSession,
    query: string,
    page: number,
    filters: ScriptLibraryFilters,
    orderBy: ScriptLibrarySort,
    signal: AbortSignal,
): Promise<{
    scripts: ScriptLibraryEntry[];
    canGoNext: boolean;
    maxPages: number | null;
}> {
    const startIndex = (page - 1) * SCRIPT_LIBRARY_PAGE_SIZE;
    const endIndex = startIndex + SCRIPT_LIBRARY_PAGE_SIZE;
    const filteredScripts: ScriptLibraryEntry[] = [];
    let sourcePage = 1;
    let maxSourcePages = session.maxPages ?? Number.POSITIVE_INFINITY;

    while (sourcePage <= maxSourcePages && filteredScripts.length <= endIndex) {
        const currentPage = await fetchScriptsPage(
            session,
            query,
            sourcePage,
            orderBy,
            signal,
        );

        maxSourcePages = currentPage.maxPages;

        for (const script of currentPage.scripts) {
            if (matchesScriptLibraryFilters(script, filters)) {
                filteredScripts.push(script);
            }
        }

        sourcePage += 1;
    }

    const sourceExhausted = sourcePage > maxSourcePages;

    return {
        scripts: filteredScripts.slice(startIndex, endIndex),
        canGoNext: filteredScripts.length > endIndex,
        maxPages: sourceExhausted
            ? Math.max(
                  1,
                  Math.ceil(filteredScripts.length / SCRIPT_LIBRARY_PAGE_SIZE),
              )
            : null,
    };
}

export async function fetchScriptText(
    script: ScriptLibraryEntry,
    signal?: AbortSignal,
): Promise<string> {
    return fetchRawScriptText(script, signal);
}

export async function copyScriptToClipboard(
    script: ScriptLibraryEntry,
): Promise<void> {
    const scriptText = await fetchScriptText(script);

    try {
        await copyTextToClipboard(scriptText);
    } catch (error) {
        throw new ScriptLibraryError({
            operation: "copyScriptToClipboard",
            message: getUnknownCauseMessage(
                error,
                "Could not copy the script to the clipboard.",
            ),
        });
    }
}
