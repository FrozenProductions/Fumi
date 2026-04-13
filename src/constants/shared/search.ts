export const SEARCH_NORMALIZED_SEPARATOR_PATTERN = /[./\\_-]+/g;
export const SEARCH_WHITESPACE_PATTERN = /\s+/g;
export const SEARCH_SINGLE_CHARACTER_QUERY_LENGTH = 1;
export const SEARCH_MATCH_SCORES = {
    exactField: 6000,
    exactToken: 5000,
    fieldPrefix: 4000,
    tokenPrefix: 3000,
    substring: 2000,
    fuzzy: 1000,
} as const;
