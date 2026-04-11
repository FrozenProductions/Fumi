import {
    RSCRIPTS_API_BASE_URL,
    SCRIPT_LIBRARY_PAGE_SIZE,
} from "../../constants/scriptLibrary/scriptLibrary";
import type {
    RscriptsGame,
    RscriptsListResponse,
    RscriptsListScript,
    RscriptsScriptDetailResponse,
    RscriptsUser,
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
} from "../../lib/scriptLibrary/scriptLibrary.type";
import { copyTextToClipboard } from "../platform/clipboard";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { isBoolean, isNumber, isRecord, isString } from "../shared/validation";
import type { ScriptLibraryCachedSession, ScriptLibraryPage } from "./api.type";
import { ScriptLibraryError } from "./errors";
import { matchesScriptLibraryFilters } from "./scriptLibrary";

function createScriptLibraryError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): ScriptLibraryError {
    return new ScriptLibraryError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}

function createInvalidScriptLibraryResponseError(
    operation: string,
): ScriptLibraryError {
    return new ScriptLibraryError({
        operation,
        message: `Unexpected response shape for ${operation}.`,
    });
}

function readOptionalString(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): string | undefined {
    const candidate = value[key];

    if (candidate === undefined) {
        return undefined;
    }

    if (!isString(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}

function readOptionalNullableString(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): string | null | undefined {
    const candidate = value[key];

    if (candidate === undefined || candidate === null) {
        return candidate;
    }

    if (!isString(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}

function readOptionalNumber(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): number | undefined {
    const candidate = value[key];

    if (candidate === undefined) {
        return undefined;
    }

    if (!isNumber(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}

function readOptionalBoolean(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): boolean | undefined {
    const candidate = value[key];

    if (candidate === undefined) {
        return undefined;
    }

    if (!isBoolean(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}

function readOptionalNullableBoolean(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): boolean | null | undefined {
    const candidate = value[key];

    if (candidate === undefined || candidate === null) {
        return candidate;
    }

    if (!isBoolean(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}

function parseRscriptsUser(value: unknown, operation: string): RscriptsUser {
    if (!isRecord(value)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return {
        _id: readOptionalString(value, "_id", operation),
        username: readOptionalNullableString(value, "username", operation),
        image: readOptionalNullableString(value, "image", operation),
        verified: readOptionalBoolean(value, "verified", operation),
    };
}

function parseRscriptsGame(value: unknown, operation: string): RscriptsGame {
    if (!isRecord(value)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return {
        _id: readOptionalString(value, "_id", operation),
        title: readOptionalNullableString(value, "title", operation),
        gameLogo: readOptionalNullableString(value, "gameLogo", operation),
        imgurl: readOptionalNullableString(value, "imgurl", operation),
        gameLink: readOptionalNullableString(value, "gameLink", operation),
    };
}

function parseRscriptsUserField(
    value: unknown,
    operation: string,
): RscriptsUser | RscriptsUser[] | null | undefined {
    if (value === undefined || value === null) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => parseRscriptsUser(entry, operation));
    }

    return parseRscriptsUser(value, operation);
}

function parseRscriptsListScript(
    value: unknown,
    operation: string,
): RscriptsListScript {
    if (!isRecord(value) || !isString(value._id)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    const game = value.game;
    const user = value.user;

    return {
        _id: value._id,
        title: readOptionalNullableString(value, "title", operation),
        views: readOptionalNumber(value, "views", operation),
        private: readOptionalBoolean(value, "private", operation),
        likes: readOptionalNumber(value, "likes", operation),
        dislikes: readOptionalNumber(value, "dislikes", operation),
        slug: readOptionalNullableString(value, "slug", operation),
        keySystem: readOptionalNullableBoolean(value, "keySystem", operation),
        mobileReady: readOptionalNullableBoolean(
            value,
            "mobileReady",
            operation,
        ),
        lastUpdated: readOptionalNullableString(
            value,
            "lastUpdated",
            operation,
        ),
        createdAt: readOptionalNullableString(value, "createdAt", operation),
        discord: readOptionalNullableString(value, "discord", operation),
        paid: readOptionalNullableBoolean(value, "paid", operation),
        description: readOptionalNullableString(
            value,
            "description",
            operation,
        ),
        image: readOptionalNullableString(value, "image", operation),
        rawScript: readOptionalNullableString(value, "rawScript", operation),
        unpatched: readOptionalNullableBoolean(value, "unpatched", operation),
        creator: readOptionalNullableString(value, "creator", operation),
        user: parseRscriptsUserField(user, operation),
        game:
            game === undefined || game === null
                ? game
                : parseRscriptsGame(game, operation),
    };
}

function parseRscriptsListResponse(
    value: unknown,
    operation: string,
): RscriptsListResponse {
    if (!isRecord(value)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    const scripts = value.scripts;
    const info = value.info;

    return {
        scripts:
            scripts === undefined
                ? undefined
                : Array.isArray(scripts)
                  ? scripts.map((script) =>
                        parseRscriptsListScript(script, operation),
                    )
                  : (() => {
                        throw createInvalidScriptLibraryResponseError(
                            operation,
                        );
                    })(),
        info:
            info === undefined
                ? undefined
                : isRecord(info)
                  ? {
                        currentPage: readOptionalNumber(
                            info,
                            "currentPage",
                            operation,
                        ),
                        maxPages: readOptionalNumber(
                            info,
                            "maxPages",
                            operation,
                        ),
                    }
                  : (() => {
                        throw createInvalidScriptLibraryResponseError(
                            operation,
                        );
                    })(),
    };
}

function parseRawScriptContainer(
    value: unknown,
    operation: string,
): { rawScript?: string | null } | null {
    if (value === undefined) {
        return null;
    }

    if (value === null) {
        return null;
    }

    if (!isRecord(value)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return {
        rawScript: readOptionalNullableString(value, "rawScript", operation),
    };
}

function parseRscriptsScriptDetailResponse(
    value: unknown,
    operation: string,
): RscriptsScriptDetailResponse {
    if (!isRecord(value)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return {
        success:
            value.success === undefined
                ? undefined
                : parseRawScriptContainer(value.success, operation),
        script:
            value.script === undefined
                ? undefined
                : parseRawScriptContainer(value.script, operation),
        error: readOptionalString(value, "error", operation),
    };
}

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

function getDetailRawScriptUrl(data: {
    success?: {
        rawScript?: string | null;
    } | null;
    script?: {
        rawScript?: string | null;
    } | null;
}): string | null {
    return (
        data.success?.rawScript?.trim() ||
        data.script?.rawScript?.trim() ||
        null
    );
}

async function fetchResponse(
    url: string,
    operation: string,
    options?: {
        signal?: AbortSignal;
    },
): Promise<Response> {
    try {
        return await fetch(url, { signal: options?.signal });
    } catch (error) {
        throw createScriptLibraryError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

async function fetchJsonResponse<T>(
    url: string,
    operation: string,
    parseValue: (value: unknown, parseOperation: string) => T,
    options?: {
        signal?: AbortSignal;
    },
): Promise<T> {
    const response = await fetchResponse(url, operation, options);

    if (!response.ok) {
        throw new ScriptLibraryError({
            operation,
            message: `${operation} failed with status ${response.status}.`,
        });
    }

    let value: unknown;

    try {
        value = await response.json();
    } catch (error) {
        throw createScriptLibraryError(
            operation,
            error,
            `Could not decode ${operation} JSON.`,
        );
    }

    return parseValue(value, operation);
}

async function fetchTextResponse(
    url: string,
    operation: string,
    options?: {
        signal?: AbortSignal;
    },
): Promise<string> {
    const response = await fetchResponse(url, operation, options);

    if (!response.ok) {
        throw new ScriptLibraryError({
            operation,
            message: `${operation} failed with status ${response.status}.`,
        });
    }

    try {
        return await response.text();
    } catch (error) {
        throw createScriptLibraryError(
            operation,
            error,
            `Could not read ${operation} text.`,
        );
    }
}

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
