export type WorkspaceEditorSearchState = {
    isOpen: boolean;
    query: string;
    replaceValue: string;
    isCaseSensitive: boolean;
    isWholeWord: boolean;
    isRegex: boolean;
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
