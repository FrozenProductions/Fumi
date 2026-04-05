import type {
    WorkspaceEditorSearchOptions,
    WorkspaceEditorSearchState,
} from "./editorSearch.type";

export const DEFAULT_WORKSPACE_EDITOR_SEARCH_STATE: WorkspaceEditorSearchState =
    {
        isOpen: false,
        query: "",
        replaceValue: "",
        isCaseSensitive: false,
        isWholeWord: false,
        isRegex: false,
    };

export function createWorkspaceEditorSearchState(
    overrides: Partial<WorkspaceEditorSearchState> = {},
): WorkspaceEditorSearchState {
    return {
        ...DEFAULT_WORKSPACE_EDITOR_SEARCH_STATE,
        ...overrides,
    };
}

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

export function canRunWorkspaceEditorSearch(
    state: Pick<WorkspaceEditorSearchState, "query" | "isRegex">,
): boolean {
    return (
        state.query.length > 0 &&
        getWorkspaceEditorSearchValidationError(state.query, state.isRegex) ===
            null
    );
}
