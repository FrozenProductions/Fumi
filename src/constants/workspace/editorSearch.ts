import type {
    WorkspaceEditorSearchMatchState,
    WorkspaceEditorSearchState,
} from "../../lib/workspace/editorSearch.type";

export const DEFAULT_WORKSPACE_EDITOR_SEARCH_STATE: WorkspaceEditorSearchState =
    {
        isOpen: false,
        query: "",
        replaceValue: "",
        isCaseSensitive: false,
        isWholeWord: false,
        isRegex: false,
        matchCount: 0,
        activeMatchOrdinal: 0,
    };

export const EMPTY_WORKSPACE_EDITOR_SEARCH_MATCH_STATE: WorkspaceEditorSearchMatchState =
    {
        activeMatchOrdinal: 0,
        matchCount: 0,
    };
