import { SCRIPT_LIBRARY_DATE_FORMATTER } from "../../constants/scriptLibrary/scriptLibrary";
import { clampWorkspaceTabBaseName } from "../workspace/fileName";
import type {
    ScriptLibraryEntry,
    ScriptLibraryFavoriteEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
} from "./scriptLibrary.type";

function normalizeScriptLibrarySearchValue(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

/**
 * Formats an ISO date string into a human-readable short date (e.g., "Apr 18, 2026").
 *
 * @remarks
 * Returns "Unknown date" for empty strings or invalid dates.
 */
export function formatScriptLibraryDate(dateString: string): string {
    if (!dateString) {
        return "Unknown date";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return SCRIPT_LIBRARY_DATE_FORMATTER.format(date);
}

/**
 * Builds a permalink URL for a script on rscripts.net.
 */
export function getScriptLibraryPermalink(
    script: Pick<ScriptLibraryEntry, "slug">,
): string {
    return `https://rscripts.net/script/${script.slug}`;
}

/**
 * Creates a workspace file name from a script title, clamped to max tab name length.
 */
export function getWorkspaceScriptFileName(
    script: Pick<ScriptLibraryEntry, "title">,
): string {
    return `${clampWorkspaceTabBaseName(script.title.trim())}.lua`;
}

/**
 * Builds the visible script title used by rscripts.net search results.
 */
export function getScriptLibraryDisplayTitle(
    script: Pick<ScriptLibraryEntry, "gameTitle" | "title">,
): string {
    const title = script.title.trim();
    const gameTitle = script.gameTitle?.trim();

    if (!gameTitle) {
        return title;
    }

    const normalizedTitle = normalizeScriptLibrarySearchValue(title);
    const normalizedGameTitle = normalizeScriptLibrarySearchValue(gameTitle);

    if (!normalizedGameTitle || normalizedTitle.includes(normalizedGameTitle)) {
        return title;
    }

    return `${gameTitle} ${title}`;
}

/**
 * Normalizes a script entry for storage in favorites by copying the creator object.
 */
export function normalizeScriptLibraryFavoriteEntry(
    script: ScriptLibraryEntry,
): ScriptLibraryFavoriteEntry {
    return {
        ...script,
        creator: {
            ...script.creator,
        },
    };
}

/**
 * Checks if a script matches the given filter criteria.
 *
 * @remarks
 * A script passes a filter if the filter is inactive (default) or the script
 * satisfies the filter condition (keyless, free, unpatched, verified).
 */
export function matchesScriptLibraryFilters(
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

/**
 * Checks if a script matches a search query against title, description, creator name, or slug.
 */
function matchesScriptLibraryQuery(
    script: ScriptLibraryEntry,
    query: string,
): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedTerms = normalizeScriptLibrarySearchValue(query)
        .split(" ")
        .filter((term) => term.length > 0);

    if (!normalizedQuery) {
        return true;
    }

    return [
        getScriptLibraryDisplayTitle(script),
        script.title,
        script.description,
        script.creator.name,
        script.slug,
    ].some((value) => {
        const normalizedValue = normalizeScriptLibrarySearchValue(value);

        return (
            value.toLowerCase().includes(normalizedQuery) ||
            normalizedTerms.every((term) => normalizedValue.includes(term))
        );
    });
}

/**
 * Sorts script entries by the specified order (views, likes, or date) with title as tiebreaker.
 */
function sortScriptLibraryEntries(
    scripts: ScriptLibraryEntry[],
    orderBy: ScriptLibrarySort,
): ScriptLibraryEntry[] {
    return scripts.toSorted((left, right) => {
        if (orderBy === "views") {
            return (
                right.views - left.views ||
                left.title.localeCompare(right.title)
            );
        }

        if (orderBy === "likes") {
            return (
                right.likes - left.likes ||
                left.title.localeCompare(right.title)
            );
        }

        const leftDate = Date.parse(left.createdAt);
        const rightDate = Date.parse(right.createdAt);
        const leftTimestamp = Number.isNaN(leftDate) ? 0 : leftDate;
        const rightTimestamp = Number.isNaN(rightDate) ? 0 : rightDate;

        return (
            rightTimestamp - leftTimestamp ||
            left.title.localeCompare(right.title)
        );
    });
}

/**
 * Filters and sorts scripts to return only visible entries matching query and filters.
 */
export function getVisibleScriptLibraryEntries(
    scripts: ScriptLibraryEntry[],
    options: {
        query: string;
        filters: ScriptLibraryFilters;
        orderBy: ScriptLibrarySort;
    },
): ScriptLibraryEntry[] {
    return sortScriptLibraryEntries(
        scripts.filter((script) => {
            return (
                matchesScriptLibraryQuery(script, options.query) &&
                matchesScriptLibraryFilters(script, options.filters)
            );
        }),
        options.orderBy,
    );
}
