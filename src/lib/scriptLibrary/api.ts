import {
    RSCRIPTS_API_BASE_URL,
    SCRIPT_LIBRARY_PAGE_SIZE,
} from "../../constants/scriptLibrary/scriptLibrary";
import type {
    RscriptsListResponse,
    RscriptsListScript,
    RscriptsScriptDetailResponse,
    RscriptsUser,
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
} from "../../types/scriptLibrary/scriptLibrary";
import { copyTextToClipboard } from "../platform/clipboard";

type ScriptLibraryPage = {
    scripts: ScriptLibraryEntry[];
    currentPage: number;
    maxPages: number;
};

export type ScriptLibraryCachedSession = {
    pages: Map<number, ScriptLibraryPage>;
    maxPages: number | null;
};

function toPositiveNumber(value: unknown, fallbackValue: number): number {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
    }

    return fallbackValue;
}

function normalizeUser(user: RscriptsListScript["user"]): RscriptsUser | null {
    if (Array.isArray(user)) {
        return user.find((candidate) => Boolean(candidate)) ?? null;
    }

    return user ?? null;
}

function normalizeCreator(script: RscriptsListScript) {
    const user = normalizeUser(script.user);
    const username = user?.username?.trim();
    const creatorName = script.creator?.trim();

    return {
        name: username || creatorName || "Unknown creator",
        image: user?.image ?? null,
        verified: user?.verified === true,
    };
}

function normalizeScript(script: RscriptsListScript): ScriptLibraryEntry {
    return {
        _id: script._id,
        title: script.title?.trim() || "Untitled script",
        description: script.description?.trim() || "No description provided.",
        createdAt: script.createdAt || script.lastUpdated || "",
        views: typeof script.views === "number" ? script.views : 0,
        likes: typeof script.likes === "number" ? script.likes : 0,
        slug: script.slug?.trim() || script._id,
        rawScript: script.rawScript?.trim() || null,
        image:
            script.image ??
            script.game?.imgurl ??
            script.game?.gameLogo ??
            null,
        paid: script.paid === true,
        keySystem:
            typeof script.keySystem === "boolean" ? script.keySystem : null,
        mobileReady:
            typeof script.mobileReady === "boolean" ? script.mobileReady : null,
        unpatched: script.unpatched === true,
        creator: normalizeCreator(script),
    };
}

function matchesFilters(
    script: ScriptLibraryEntry,
    filters: ScriptLibraryFilters,
): boolean {
    if (filters.keyless && script.keySystem !== false) {
        return false;
    }

    if (filters.free && script.paid !== false) {
        return false;
    }

    if (filters.unpatched && script.unpatched !== true) {
        return false;
    }

    if (filters.verified && script.creator.verified !== true) {
        return false;
    }

    return true;
}

function getDetailRawScriptUrl(
    data: RscriptsScriptDetailResponse,
): string | null {
    return (
        data.success?.rawScript?.trim() ||
        data.script?.rawScript?.trim() ||
        null
    );
}

async function fetchRawScriptText(
    script: ScriptLibraryEntry,
    signal?: AbortSignal,
): Promise<string> {
    let rawScriptUrl = script.rawScript;

    if (!rawScriptUrl) {
        const detailResponse = await fetch(
            `${RSCRIPTS_API_BASE_URL}/script?id=${script._id}`,
            { signal },
        );

        if (detailResponse.ok) {
            const detailData =
                (await detailResponse.json()) as RscriptsScriptDetailResponse;
            rawScriptUrl = getDetailRawScriptUrl(detailData);
        }
    }

    if (!rawScriptUrl) {
        throw new Error("Raw script URL is unavailable.");
    }

    const rawScriptResponse = await fetch(rawScriptUrl, { signal });

    if (!rawScriptResponse.ok) {
        throw new Error(
            `Failed to fetch raw script: ${rawScriptResponse.status}`,
        );
    }

    return rawScriptResponse.text();
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

    const response = await fetch(
        `${RSCRIPTS_API_BASE_URL}/scripts?${params.toString()}`,
        { signal },
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch scripts: ${response.status}`);
    }

    const data = (await response.json()) as RscriptsListResponse;
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
            if (matchesFilters(script, filters)) {
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
): Promise<string> {
    const controller = new AbortController();
    return fetchRawScriptText(script, controller.signal);
}

export async function copyScriptToClipboard(
    script: ScriptLibraryEntry,
): Promise<void> {
    const scriptText = await fetchScriptText(script);

    await copyTextToClipboard(scriptText);
}
