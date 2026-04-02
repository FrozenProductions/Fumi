import { Effect, Schema } from "effect";
import {
    RSCRIPTS_API_BASE_URL,
    SCRIPT_LIBRARY_PAGE_SIZE,
} from "../../constants/scriptLibrary/scriptLibrary";
import type {
    RscriptsListScript,
    RscriptsUser,
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
} from "../../types/scriptLibrary/scriptLibrary";
import { copyTextToClipboardEffect } from "../platform/clipboard";
import { runPromise } from "../shared/effectRuntime";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { decodeUnknownWithSchema } from "../shared/schema";
import { combineAbortSignals } from "./abort";
import { ScriptLibraryError } from "./errors";

type ScriptLibraryPage = {
    scripts: ScriptLibraryEntry[];
    currentPage: number;
    maxPages: number;
};

export type ScriptLibraryCachedSession = {
    pages: Map<number, ScriptLibraryPage>;
    maxPages: number | null;
};

const RscriptsUserSchema = Schema.Struct({
    _id: Schema.optional(Schema.String),
    username: Schema.optionalWith(Schema.String, { nullable: true }),
    image: Schema.optionalWith(Schema.String, { nullable: true }),
    verified: Schema.optional(Schema.Boolean),
});

const RscriptsGameSchema = Schema.Struct({
    _id: Schema.optional(Schema.String),
    title: Schema.optionalWith(Schema.String, { nullable: true }),
    gameLogo: Schema.optionalWith(Schema.String, { nullable: true }),
    imgurl: Schema.optionalWith(Schema.String, { nullable: true }),
    gameLink: Schema.optionalWith(Schema.String, { nullable: true }),
});

const RscriptsListScriptSchema = Schema.Struct({
    _id: Schema.String,
    title: Schema.optionalWith(Schema.String, { nullable: true }),
    views: Schema.optional(Schema.Number),
    private: Schema.optional(Schema.Boolean),
    likes: Schema.optional(Schema.Number),
    dislikes: Schema.optional(Schema.Number),
    slug: Schema.optionalWith(Schema.String, { nullable: true }),
    keySystem: Schema.optionalWith(Schema.Boolean, { nullable: true }),
    mobileReady: Schema.optionalWith(Schema.Boolean, { nullable: true }),
    lastUpdated: Schema.optionalWith(Schema.String, { nullable: true }),
    createdAt: Schema.optionalWith(Schema.String, { nullable: true }),
    discord: Schema.optionalWith(Schema.String, { nullable: true }),
    paid: Schema.optionalWith(Schema.Boolean, { nullable: true }),
    description: Schema.optionalWith(Schema.String, { nullable: true }),
    image: Schema.optionalWith(Schema.String, { nullable: true }),
    rawScript: Schema.optionalWith(Schema.String, { nullable: true }),
    unpatched: Schema.optionalWith(Schema.Boolean, { nullable: true }),
    creator: Schema.optionalWith(Schema.String, { nullable: true }),
    user: Schema.optionalWith(
        Schema.Union(RscriptsUserSchema, Schema.Array(RscriptsUserSchema)),
        { nullable: true },
    ),
    game: Schema.optionalWith(RscriptsGameSchema, { nullable: true }),
});

const RscriptsListResponseSchema = Schema.Struct({
    scripts: Schema.optional(Schema.Array(RscriptsListScriptSchema)),
    info: Schema.optional(
        Schema.Struct({
            currentPage: Schema.optional(Schema.Number),
            maxPages: Schema.optional(Schema.Number),
        }),
    ),
});

const RscriptsScriptDetailResponseSchema = Schema.Struct({
    success: Schema.optionalWith(
        Schema.Struct({
            rawScript: Schema.optionalWith(Schema.String, { nullable: true }),
        }),
        { nullable: true },
    ),
    script: Schema.optionalWith(
        Schema.Struct({
            rawScript: Schema.optionalWith(Schema.String, { nullable: true }),
        }),
        { nullable: true },
    ),
    error: Schema.optional(Schema.String),
});

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

function fetchResponseEffect(
    url: string,
    operation: string,
    options?: {
        signal?: AbortSignal;
    },
): Effect.Effect<Response, ScriptLibraryError> {
    return Effect.tryPromise({
        try: (effectSignal) => {
            const { signal, cleanup } = combineAbortSignals(
                effectSignal,
                options?.signal,
            );

            return fetch(url, { signal }).finally(() => {
                cleanup();
            });
        },
        catch: (error) =>
            createScriptLibraryError(
                operation,
                error,
                `Could not complete ${operation}.`,
            ),
    });
}

function fetchJsonResponseEffect<A, I>(
    url: string,
    schema: Schema.Schema<A, I, never>,
    operation: string,
    options?: {
        signal?: AbortSignal;
    },
): Effect.Effect<A, ScriptLibraryError> {
    return fetchResponseEffect(url, operation, options).pipe(
        Effect.flatMap((response) => {
            if (!response.ok) {
                return Effect.fail(
                    new ScriptLibraryError({
                        operation,
                        message: `${operation} failed with status ${response.status}.`,
                    }),
                );
            }

            return Effect.tryPromise({
                try: () => response.json(),
                catch: (error) =>
                    createScriptLibraryError(
                        operation,
                        error,
                        `Could not decode ${operation} JSON.`,
                    ),
            }).pipe(
                Effect.flatMap((value) =>
                    decodeUnknownWithSchema(
                        schema,
                        value,
                        () =>
                            new ScriptLibraryError({
                                operation,
                                message: `Unexpected response shape for ${operation}.`,
                            }),
                    ),
                ),
            );
        }),
    );
}

function fetchTextResponseEffect(
    url: string,
    operation: string,
    options?: {
        signal?: AbortSignal;
    },
): Effect.Effect<string, ScriptLibraryError> {
    return fetchResponseEffect(url, operation, options).pipe(
        Effect.flatMap((response) => {
            if (!response.ok) {
                return Effect.fail(
                    new ScriptLibraryError({
                        operation,
                        message: `${operation} failed with status ${response.status}.`,
                    }),
                );
            }

            return Effect.tryPromise({
                try: () => response.text(),
                catch: (error) =>
                    createScriptLibraryError(
                        operation,
                        error,
                        `Could not read ${operation} text.`,
                    ),
            });
        }),
    );
}

function fetchRawScriptTextEffect(
    script: ScriptLibraryEntry,
    signal?: AbortSignal,
): Effect.Effect<string, ScriptLibraryError> {
    return Effect.gen(function* () {
        let rawScriptUrl = script.rawScript;

        if (!rawScriptUrl) {
            const detailData = yield* fetchJsonResponseEffect(
                `${RSCRIPTS_API_BASE_URL}/script?id=${script._id}`,
                RscriptsScriptDetailResponseSchema,
                "fetchScriptDetail",
                { signal },
            );

            rawScriptUrl = getDetailRawScriptUrl(detailData);
        }

        if (!rawScriptUrl) {
            return yield* Effect.fail(
                new ScriptLibraryError({
                    operation: "fetchScriptText",
                    message: "Raw script URL is unavailable.",
                }),
            );
        }

        return yield* fetchTextResponseEffect(
            rawScriptUrl,
            "fetchRawScriptText",
            { signal },
        );
    });
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
    return runPromise(
        fetchScriptsPageEffect(session, query, page, orderBy, signal),
    );
}

export function fetchScriptsPageEffect(
    session: ScriptLibraryCachedSession,
    query: string,
    page: number,
    orderBy: ScriptLibrarySort,
    signal: AbortSignal,
): Effect.Effect<ScriptLibraryPage, ScriptLibraryError> {
    const cachedPage = session.pages.get(page);

    if (cachedPage) {
        return Effect.succeed(cachedPage);
    }

    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("orderBy", orderBy);
    params.set("sort", "desc");

    if (query) {
        params.set("q", query);
    }

    return fetchJsonResponseEffect(
        `${RSCRIPTS_API_BASE_URL}/scripts?${params.toString()}`,
        RscriptsListResponseSchema,
        "fetchScriptsPage",
        { signal },
    ).pipe(
        Effect.map((data) => {
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
        }),
    );
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
    return runPromise(
        fetchFilteredScriptsPageEffect(
            session,
            query,
            page,
            filters,
            orderBy,
            signal,
        ),
    );
}

export function fetchFilteredScriptsPageEffect(
    session: ScriptLibraryCachedSession,
    query: string,
    page: number,
    filters: ScriptLibraryFilters,
    orderBy: ScriptLibrarySort,
    signal: AbortSignal,
): Effect.Effect<
    {
        scripts: ScriptLibraryEntry[];
        canGoNext: boolean;
        maxPages: number | null;
    },
    ScriptLibraryError
> {
    return Effect.gen(function* () {
        const startIndex = (page - 1) * SCRIPT_LIBRARY_PAGE_SIZE;
        const endIndex = startIndex + SCRIPT_LIBRARY_PAGE_SIZE;
        const filteredScripts: ScriptLibraryEntry[] = [];
        let sourcePage = 1;
        let maxSourcePages = session.maxPages ?? Number.POSITIVE_INFINITY;

        while (
            sourcePage <= maxSourcePages &&
            filteredScripts.length <= endIndex
        ) {
            const currentPage = yield* fetchScriptsPageEffect(
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
                      Math.ceil(
                          filteredScripts.length / SCRIPT_LIBRARY_PAGE_SIZE,
                      ),
                  )
                : null,
        };
    });
}

export async function fetchScriptText(
    script: ScriptLibraryEntry,
): Promise<string> {
    return runPromise(fetchScriptTextEffect(script));
}

export function fetchScriptTextEffect(
    script: ScriptLibraryEntry,
    signal?: AbortSignal,
): Effect.Effect<string, ScriptLibraryError> {
    return fetchRawScriptTextEffect(script, signal);
}

export async function copyScriptToClipboard(
    script: ScriptLibraryEntry,
): Promise<void> {
    return runPromise(copyScriptToClipboardEffect(script));
}

export function copyScriptToClipboardEffect(
    script: ScriptLibraryEntry,
): Effect.Effect<void, ScriptLibraryError> {
    return fetchScriptTextEffect(script).pipe(
        Effect.flatMap((scriptText) =>
            copyTextToClipboardEffect(scriptText).pipe(
                Effect.mapError(
                    (error) =>
                        new ScriptLibraryError({
                            operation: "copyScriptToClipboard",
                            message: error.message,
                        }),
                ),
            ),
        ),
    );
}
