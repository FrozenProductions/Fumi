import {
    SEARCH_MATCH_SCORES,
    SEARCH_NORMALIZED_SEPARATOR_PATTERN,
    SEARCH_SINGLE_CHARACTER_QUERY_LENGTH,
    SEARCH_WHITESPACE_PATTERN,
} from "../../constants/shared/search";
import type { SearchField, SearchResult } from "./search.type";

export function normalizeSearchValue(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(SEARCH_NORMALIZED_SEPARATOR_PATTERN, " ")
        .replace(SEARCH_WHITESPACE_PATTERN, " ");
}

export function matchesSearchFields<TFieldName extends string>(
    fields: SearchField<TFieldName>[],
    searchValue: string,
    fieldWeights: Record<TFieldName, number>,
): boolean {
    return scoreSearchFields(fields, searchValue, fieldWeights) !== null;
}

export function scoreSearchFields<TFieldName extends string>(
    fields: SearchField<TFieldName>[],
    searchValue: string,
    fieldWeights: Record<TFieldName, number>,
): number | null {
    const normalizedSearchValue = normalizeSearchValue(searchValue);

    if (!normalizedSearchValue) {
        return 0;
    }

    let bestScore: number | null = null;

    for (const field of fields) {
        const fieldScore = scoreSearchField(field.value, normalizedSearchValue);

        if (fieldScore === null) {
            continue;
        }

        const weightedFieldScore = fieldScore + fieldWeights[field.name];

        if (bestScore === null || weightedFieldScore > bestScore) {
            bestScore = weightedFieldScore;
        }
    }

    return bestScore;
}

export function searchItems<TItem, TFieldName extends string>(
    items: TItem[],
    searchValue: string,
    limit: number,
    getFields: (item: TItem) => SearchField<TFieldName>[],
    fieldWeights: Record<TFieldName, number>,
): TItem[] {
    if (limit <= 0) {
        return [];
    }

    if (!normalizeSearchValue(searchValue)) {
        return items.slice(0, limit);
    }

    return items
        .map(
            (item, index): SearchResult<TItem> => ({
                item,
                index,
                score:
                    scoreSearchFields(
                        getFields(item),
                        searchValue,
                        fieldWeights,
                    ) ?? -1,
            }),
        )
        .filter((entry): entry is SearchResult<TItem> => entry.score !== -1)
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            return left.index - right.index;
        })
        .slice(0, limit)
        .map((entry) => entry.item);
}

function scoreSearchField(
    fieldValue: string,
    searchValue: string,
): number | null {
    const normalizedFieldValue = normalizeSearchValue(fieldValue);

    if (!normalizedFieldValue) {
        return null;
    }

    const exactFieldScore = scoreExactFieldMatch(
        normalizedFieldValue,
        searchValue,
    );

    if (exactFieldScore !== null) {
        return exactFieldScore;
    }

    const tokenizedFieldValue = normalizedFieldValue.split(" ");
    const exactTokenScore = scoreExactTokenMatch(
        tokenizedFieldValue,
        normalizedFieldValue,
        searchValue,
    );

    if (exactTokenScore !== null) {
        return exactTokenScore;
    }

    const fieldPrefixScore = scoreFieldPrefixMatch(
        normalizedFieldValue,
        searchValue,
    );

    if (fieldPrefixScore !== null) {
        return fieldPrefixScore;
    }

    const tokenPrefixScore = scoreTokenPrefixMatch(
        tokenizedFieldValue,
        normalizedFieldValue,
        searchValue,
    );

    if (tokenPrefixScore !== null) {
        return tokenPrefixScore;
    }

    const substringScore = scoreSubstringMatch(
        normalizedFieldValue,
        searchValue,
    );

    if (substringScore !== null) {
        return substringScore;
    }

    if (searchValue.length <= SEARCH_SINGLE_CHARACTER_QUERY_LENGTH) {
        return null;
    }

    return scoreFuzzySubsequenceMatch(normalizedFieldValue, searchValue);
}

function scoreExactFieldMatch(
    fieldValue: string,
    searchValue: string,
): number | null {
    if (fieldValue !== searchValue) {
        return null;
    }

    return SEARCH_MATCH_SCORES.exactField;
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
        SEARCH_MATCH_SCORES.exactToken -
        tokenIndex * 10 -
        getSearchLengthPenalty(fieldValue)
    );
}

function scoreFieldPrefixMatch(
    fieldValue: string,
    searchValue: string,
): number | null {
    if (!fieldValue.startsWith(searchValue)) {
        return null;
    }

    return SEARCH_MATCH_SCORES.fieldPrefix - getSearchLengthPenalty(fieldValue);
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
        SEARCH_MATCH_SCORES.tokenPrefix -
        tokenIndex * 10 -
        getSearchLengthPenalty(fieldValue)
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
        SEARCH_MATCH_SCORES.substring +
        boundaryBonus -
        matchIndex * 5 -
        getSearchLengthPenalty(fieldValue)
    );
}

function scoreFuzzySubsequenceMatch(
    fieldValue: string,
    searchValue: string,
): number | null {
    let score = SEARCH_MATCH_SCORES.fuzzy;
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

    if (score <= SEARCH_MATCH_SCORES.fuzzy) {
        return null;
    }

    return score;
}

function getSearchLengthPenalty(fieldValue: string): number {
    return Math.min(fieldValue.length, 120);
}
