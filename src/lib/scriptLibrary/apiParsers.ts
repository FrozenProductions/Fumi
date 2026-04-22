import { isRecord, isString } from "../shared/validation";
import { createInvalidScriptLibraryResponseError } from "./apiErrors";
import {
    readOptionalBoolean,
    readOptionalNullableBoolean,
    readOptionalNullableString,
    readOptionalNumber,
    readOptionalString,
} from "./apiResponseReaders";
import type {
    RscriptsGame,
    RscriptsListResponse,
    RscriptsListScript,
    RscriptsScriptDetailResponse,
    RscriptsUser,
    ScriptLibraryEntry,
} from "./scriptLibrary.type";

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

export function parseRscriptsListResponse(
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

export function parseRscriptsScriptDetailResponse(
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

export function toPositiveNumber(
    value: unknown,
    fallbackValue: number,
): number {
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

export function normalizeScript(
    script: RscriptsListScript,
): ScriptLibraryEntry {
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

export function getDetailRawScriptUrl(data: {
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
