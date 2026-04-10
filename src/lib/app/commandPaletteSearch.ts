import {
    APP_COMMAND_PALETTE_NORMALIZED_SEPARATOR_PATTERN,
    APP_COMMAND_PALETTE_SEARCH_FIELD_SCORES,
    APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS,
    APP_COMMAND_PALETTE_SINGLE_CHARACTER_QUERY_LENGTH,
    APP_COMMAND_PALETTE_WHITESPACE_PATTERN,
} from "../../constants/app/commandPalette";
import type { AppCommandPaletteItem } from "../../lib/app/app.type";
import type {
    AppCommandPaletteSearchFieldName,
    AppCommandPaletteSearchResult,
} from "./commandPalette.type";

export function normalizeAppCommandPaletteSearchValue(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(APP_COMMAND_PALETTE_NORMALIZED_SEPARATOR_PATTERN, " ")
        .replace(APP_COMMAND_PALETTE_WHITESPACE_PATTERN, " ");
}

export function matchesAppCommandPaletteItem(
    item: AppCommandPaletteItem,
    searchValue: string,
): boolean {
    return scoreAppCommandPaletteItem(item, searchValue) !== null;
}

export function scoreAppCommandPaletteItem(
    item: AppCommandPaletteItem,
    searchValue: string,
): number | null {
    const normalizedSearchValue =
        normalizeAppCommandPaletteSearchValue(searchValue);

    if (!normalizedSearchValue) {
        return 0;
    }

    const fieldScores = [
        scoreAppCommandPaletteField(item.label, normalizedSearchValue, "label"),
        scoreAppCommandPaletteField(
            item.keywords,
            normalizedSearchValue,
            "keywords",
        ),
        scoreAppCommandPaletteField(
            item.meta ?? "",
            normalizedSearchValue,
            "meta",
        ),
        scoreAppCommandPaletteField(
            item.description,
            normalizedSearchValue,
            "description",
        ),
    ];
    let bestScore: number | null = null;

    for (const fieldScore of fieldScores) {
        if (fieldScore === null) {
            continue;
        }

        if (bestScore === null || fieldScore > bestScore) {
            bestScore = fieldScore;
        }
    }

    return bestScore;
}

export function searchAppCommandPaletteItems(
    items: AppCommandPaletteItem[],
    searchValue: string,
    limit: number,
): AppCommandPaletteItem[] {
    if (limit <= 0) {
        return [];
    }

    if (!searchValue) {
        return items.slice(0, limit);
    }

    return items
        .map(
            (item, index): AppCommandPaletteSearchResult => ({
                item,
                index,
                score: scoreAppCommandPaletteItem(item, searchValue) ?? -1,
            }),
        )
        .filter(
            (entry): entry is AppCommandPaletteSearchResult =>
                entry.score !== -1,
        )
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            return left.index - right.index;
        })
        .slice(0, limit)
        .map((entry) => entry.item);
}

function scoreAppCommandPaletteField(
    fieldValue: string,
    searchValue: string,
    fieldName: AppCommandPaletteSearchFieldName,
): number | null {
    const normalizedFieldValue =
        normalizeAppCommandPaletteSearchValue(fieldValue);

    if (!normalizedFieldValue) {
        return null;
    }

    const exactFieldScore = scoreExactFieldMatch(
        normalizedFieldValue,
        searchValue,
    );

    if (exactFieldScore !== null) {
        return (
            exactFieldScore +
            APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS[fieldName]
        );
    }

    const tokenizedFieldValue = normalizedFieldValue.split(" ");
    const exactTokenScore = scoreExactTokenMatch(
        tokenizedFieldValue,
        normalizedFieldValue,
        searchValue,
    );

    if (exactTokenScore !== null) {
        return (
            exactTokenScore +
            APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS[fieldName]
        );
    }

    const fieldPrefixScore = scoreFieldPrefixMatch(
        normalizedFieldValue,
        searchValue,
    );

    if (fieldPrefixScore !== null) {
        return (
            fieldPrefixScore +
            APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS[fieldName]
        );
    }

    const tokenPrefixScore = scoreTokenPrefixMatch(
        tokenizedFieldValue,
        normalizedFieldValue,
        searchValue,
    );

    if (tokenPrefixScore !== null) {
        return (
            tokenPrefixScore +
            APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS[fieldName]
        );
    }

    const substringScore = scoreSubstringMatch(
        normalizedFieldValue,
        searchValue,
    );

    if (substringScore !== null) {
        return (
            substringScore + APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS[fieldName]
        );
    }

    if (
        searchValue.length <= APP_COMMAND_PALETTE_SINGLE_CHARACTER_QUERY_LENGTH
    ) {
        return null;
    }

    const fuzzyScore = scoreFuzzySubsequenceMatch(
        normalizedFieldValue,
        searchValue,
    );

    if (fuzzyScore === null) {
        return null;
    }

    return fuzzyScore + APP_COMMAND_PALETTE_SEARCH_FIELD_WEIGHTS[fieldName];
}

function scoreExactFieldMatch(
    fieldValue: string,
    searchValue: string,
): number | null {
    if (fieldValue !== searchValue) {
        return null;
    }

    return APP_COMMAND_PALETTE_SEARCH_FIELD_SCORES.exactField;
}

function scoreExactTokenMatch(
    tokens: string[],
    fieldValue: string,
    searchValue: string,
): number | null {
    const tokenIndex = tokens.indexOf(searchValue);

    if (tokenIndex < 0) {
        return null;
    }

    return (
        APP_COMMAND_PALETTE_SEARCH_FIELD_SCORES.exactToken -
        tokenIndex * 10 -
        getCommandPaletteLengthPenalty(fieldValue)
    );
}

function scoreFieldPrefixMatch(
    fieldValue: string,
    searchValue: string,
): number | null {
    if (!fieldValue.startsWith(searchValue)) {
        return null;
    }

    return (
        APP_COMMAND_PALETTE_SEARCH_FIELD_SCORES.fieldPrefix -
        getCommandPaletteLengthPenalty(fieldValue)
    );
}

function scoreTokenPrefixMatch(
    tokens: string[],
    fieldValue: string,
    searchValue: string,
): number | null {
    const tokenIndex = tokens.findIndex((token) =>
        token.startsWith(searchValue),
    );

    if (tokenIndex < 0) {
        return null;
    }

    return (
        APP_COMMAND_PALETTE_SEARCH_FIELD_SCORES.tokenPrefix -
        tokenIndex * 10 -
        getCommandPaletteLengthPenalty(fieldValue)
    );
}

function scoreSubstringMatch(
    fieldValue: string,
    searchValue: string,
): number | null {
    const matchIndex = fieldValue.indexOf(searchValue);

    if (matchIndex < 0) {
        return null;
    }

    const boundaryBonus =
        matchIndex === 0 || fieldValue[matchIndex - 1] === " " ? 20 : 0;

    return (
        APP_COMMAND_PALETTE_SEARCH_FIELD_SCORES.substring +
        boundaryBonus -
        matchIndex * 5 -
        getCommandPaletteLengthPenalty(fieldValue)
    );
}

function scoreFuzzySubsequenceMatch(
    fieldValue: string,
    searchValue: string,
): number | null {
    let score = APP_COMMAND_PALETTE_SEARCH_FIELD_SCORES.fuzzy;
    let previousMatchIndex = -1;
    let consecutiveMatchRunLength = 0;

    for (const character of searchValue) {
        const matchIndex = fieldValue.indexOf(
            character,
            previousMatchIndex + 1,
        );

        if (matchIndex < 0) {
            return null;
        }

        if (previousMatchIndex < 0) {
            score += 80 - Math.min(matchIndex * 4, 48);
        } else {
            const gapSize = matchIndex - previousMatchIndex - 1;

            score -= Math.min(gapSize * 4, 64);
        }

        if (matchIndex === 0 || fieldValue[matchIndex - 1] === " ") {
            score += 28;
        }

        if (matchIndex === previousMatchIndex + 1) {
            consecutiveMatchRunLength += 1;
            score += 34 + consecutiveMatchRunLength * 8;
        } else {
            consecutiveMatchRunLength = 0;
        }

        previousMatchIndex = matchIndex;
    }

    score -= Math.min((fieldValue.length - searchValue.length) * 2, 48);
    score -= Math.min(fieldValue.length - previousMatchIndex - 1, 20);

    if (score <= APP_COMMAND_PALETTE_SEARCH_FIELD_SCORES.fuzzy) {
        return null;
    }

    return score;
}

function getCommandPaletteLengthPenalty(fieldValue: string): number {
    return Math.min(fieldValue.length, 120);
}
