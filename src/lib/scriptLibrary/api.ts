import {
    RSCRIPTS_API_BASE_URL,
    SCRIPT_LIBRARY_PAGE_SIZE,
} from "../../constants/scriptLibrary/scriptLibrary";
import { copyTextToClipboard } from "../platform/core/clipboard";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import type {
    ScriptLibraryCachedSession,
    ScriptLibraryFilteredCache,
    ScriptLibraryPage,
} from "./api.type";
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

function createFilteredCache(): ScriptLibraryFilteredCache {
    return {
        filteredScripts: [],
        isSourceExhausted: false,
        maxSourcePages: null,
        nextSourcePage: 1,
    };
}

/**
 * Creates a fresh cached session for script library browsing.
 *
 * @returns An empty session with no cached pages or filtered results
 */
export function createScriptLibraryCachedSession(): ScriptLibraryCachedSession {
    return {
        filteredResults: new Map<string, ScriptLibraryFilteredCache>(),
        pages: new Map<number, ScriptLibraryPage>(),
        maxPages: null,
    };
}

/**
 * Produces a stable cache key from a query and sort order for session lookups.
 *
 * @param query - The search query string
 * @param orderBy - The active sort option
 * @returns A JSON string suitable for use as a Map key
 */
export function getScriptLibrarySessionKey(
    query: string,
    orderBy: ScriptLibrarySort,
): string {
    return JSON.stringify({
        query: query.trim().toLowerCase(),
        orderBy,
    });
}

/**
 * Checks whether any script library filter toggles are active.
 *
 * @param filters - The current filter state
 * @returns True if at least one filter toggle is enabled
 */
export function hasActiveScriptLibraryFilters(
    filters: ScriptLibraryFilters,
): boolean {
    return (
        filters.keyless || filters.free || filters.unpatched || filters.verified
    );
}

function getScriptLibraryFilterKey(filters: ScriptLibraryFilters): string {
    return JSON.stringify({
        free: filters.free,
        keyless: filters.keyless,
        unpatched: filters.unpatched,
        verified: filters.verified,
    });
}

function getScriptLibraryFilteredCache(
    session: ScriptLibraryCachedSession,
    filters: ScriptLibraryFilters,
): ScriptLibraryFilteredCache {
    const filterKey = getScriptLibraryFilterKey(filters);
    const existingCache = session.filteredResults.get(filterKey);

    if (existingCache) {
        return existingCache;
    }

    const cache = createFilteredCache();

    session.filteredResults.set(filterKey, cache);
    return cache;
}

/**
 * Fetches a single page of scripts from the remote API, caching the result in the session.
 *
 * Returns the cached page if available; otherwise fetches, parses, normalizes, and stores it.
 *
 * @param session - The active cached session
 * @param query - Search query string (empty for no filter)
 * @param page - 1-based page number
 * @param orderBy - Sort order for results
 * @param signal - Abort signal for cancellation
 * @returns The fetched or cached page of normalized scripts
 */
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

/**
 * Fetches a page of scripts matching the given filters by lazily loading source pages until the slice is filled.
 *
 * Internally paginates the unfiltered API and filters client-side, caching results per filter combination.
 *
 * @param session - The active cached session
 * @param query - Search query string
 * @param page - 1-based page number within filtered results
 * @param filters - Active filter toggles
 * @param orderBy - Sort order for source pages
 * @param signal - Abort signal for cancellation
 * @returns Filtered scripts for the requested page and pagination metadata
 */
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
    const cache = getScriptLibraryFilteredCache(session, filters);
    let sourcePage = cache.nextSourcePage;
    let maxSourcePages =
        cache.maxSourcePages ?? session.maxPages ?? Number.POSITIVE_INFINITY;

    while (
        !cache.isSourceExhausted &&
        sourcePage <= maxSourcePages &&
        cache.filteredScripts.length <= endIndex
    ) {
        const currentPage = await fetchScriptsPage(
            session,
            query,
            sourcePage,
            orderBy,
            signal,
        );

        maxSourcePages = currentPage.maxPages;
        cache.maxSourcePages = maxSourcePages;

        for (const script of currentPage.scripts) {
            if (matchesScriptLibraryFilters(script, filters)) {
                cache.filteredScripts.push(script);
            }
        }

        sourcePage += 1;
        cache.nextSourcePage = sourcePage;
    }

    cache.isSourceExhausted = sourcePage > maxSourcePages;

    return {
        scripts: cache.filteredScripts.slice(startIndex, endIndex),
        canGoNext: cache.filteredScripts.length > endIndex,
        maxPages: cache.isSourceExhausted
            ? Math.max(
                  1,
                  Math.ceil(
                      cache.filteredScripts.length / SCRIPT_LIBRARY_PAGE_SIZE,
                  ),
              )
            : null,
    };
}

/**
 * Fetches the raw source text of a script, fetching the detail URL first if not already available.
 *
 * @param script - The script entry to fetch text for
 * @param signal - Optional abort signal for cancellation
 * @returns The raw script source text
 * @throws {ScriptLibraryError} If the raw script URL is unavailable or the fetch fails
 */
export async function fetchScriptText(
    script: ScriptLibraryEntry,
    signal?: AbortSignal,
): Promise<string> {
    return fetchRawScriptText(script, signal);
}

/**
 * Fetches a script's source text and copies it to the system clipboard.
 *
 * @param script - The script entry to copy
 * @throws {ScriptLibraryError} If fetching or clipboard write fails
 */
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
