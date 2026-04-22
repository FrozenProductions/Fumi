import type { Ace } from "ace-builds";

export type WorkspaceEditorSearchState = {
    isOpen: boolean;
    query: string;
    replaceValue: string;
    isCaseSensitive: boolean;
    isWholeWord: boolean;
    isRegex: boolean;
    matchCount: number;
    activeMatchOrdinal: number;
};

export type WorkspaceEditorSearchMatchState = Pick<
    WorkspaceEditorSearchState,
    "activeMatchOrdinal" | "matchCount"
>;

export type AceEditorSearchInstance = {
    set: (options: Partial<Ace.SearchOptions>) => AceEditorSearchInstance;
    findAll: (session: Ace.EditSession) => Ace.Range[];
};

export type AceEditorWithSearch = Ace.Editor & {
    $search?: AceEditorSearchInstance;
};

export type WorkspaceEditorSearchOptions = {
    needle: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    regExp: boolean;
    wrap: true;
};

export type WorkspaceEditorSearchController = {
    state: WorkspaceEditorSearchState;
    canSearch: boolean;
    validationError: string | null;
    focusRequestKey: number;
    onToggle: () => void;
    onQueryChange: (value: string) => void;
    onReplaceValueChange: (value: string) => void;
    onToggleCaseSensitive: () => void;
    onToggleWholeWord: () => void;
    onToggleRegex: () => void;
    onFindNext: () => void;
    onFindPrevious: () => void;
    onReplaceNext: () => void;
    onReplaceAll: () => void;
    onClose: () => void;
};
