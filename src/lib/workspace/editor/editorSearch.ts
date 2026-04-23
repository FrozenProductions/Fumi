import { DEFAULT_WORKSPACE_EDITOR_SEARCH_STATE } from "../../../constants/workspace/editorSearch";
import type {
    WorkspaceEditorSearchOptions,
    WorkspaceEditorSearchState,
} from "./editorSearch.type";

/**
 * Creates a workspace editor search state with optional overrides to defaults.
 */
export function createWorkspaceEditorSearchState(
    overrides: Partial<WorkspaceEditorSearchState> = {},
): WorkspaceEditorSearchState {
    return {
        ...DEFAULT_WORKSPACE_EDITOR_SEARCH_STATE,
        ...overrides,
    };
}

/**
 * Builds Ace search options from a workspace editor search state.
 */
export function buildWorkspaceEditorSearchOptions(
    state: Pick<
        WorkspaceEditorSearchState,
        "query" | "isCaseSensitive" | "isWholeWord" | "isRegex"
    >,
): WorkspaceEditorSearchOptions {
    return {
        needle: state.query,
        caseSensitive: state.isCaseSensitive,
        wholeWord: state.isWholeWord,
        regExp: state.isRegex,
        wrap: true,
    };
}

/**
 * Validates a search query, returning an error message or null if valid.
 *
 * @remarks
 * For regex mode, tests whether the query is a valid RegExp.
 */
export function getWorkspaceEditorSearchValidationError(
    query: string,
    isRegex: boolean,
): string | null {
    if (!isRegex || query.length === 0) {
        return null;
    }

    try {
        new RegExp(query, "u");
        return null;
    } catch {
        return "Invalid regular expression";
    }
}

/**
 * Returns whether the editor search can run with the current query and regex mode.
 */
export function canRunWorkspaceEditorSearch(
    state: Pick<WorkspaceEditorSearchState, "query" | "isRegex">,
): boolean {
    return (
        state.query.length > 0 &&
        getWorkspaceEditorSearchValidationError(state.query, state.isRegex) ===
            null
    );
}
