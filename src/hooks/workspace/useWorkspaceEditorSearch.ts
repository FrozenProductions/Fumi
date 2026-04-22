import type { Ace } from "ace-builds";
import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_WORKSPACE_EDITOR_SEARCH_MATCH_STATE } from "../../constants/workspace/editorSearch";
import type { AceEditorInstance } from "../../lib/workspace/codeCompletion/ace.type";
import {
    buildWorkspaceEditorSearchOptions,
    canRunWorkspaceEditorSearch,
    createWorkspaceEditorSearchState,
    getWorkspaceEditorSearchValidationError,
} from "../../lib/workspace/editorSearch";
import type {
    AceEditorWithSearch,
    WorkspaceEditorSearchMatchState,
    WorkspaceEditorSearchState,
} from "../../lib/workspace/editorSearch.type";
import type {
    SearchStateByTabId,
    UseWorkspaceEditorSearchOptions,
    UseWorkspaceEditorSearchResult,
} from "./useWorkspaceEditorSearch.type";

function areAcePointsEqual(left: Ace.Point, right: Ace.Point): boolean {
    return left.row === right.row && left.column === right.column;
}

function areAceRangesEqual(left: Ace.Range, right: Ace.Range): boolean {
    return (
        areAcePointsEqual(left.start, right.start) &&
        areAcePointsEqual(left.end, right.end)
    );
}

function getWorkspaceEditorSearchMatchState(
    editor: AceEditorInstance,
    searchState: WorkspaceEditorSearchState,
): WorkspaceEditorSearchMatchState {
    if (!canRunWorkspaceEditorSearch(searchState)) {
        return EMPTY_WORKSPACE_EDITOR_SEARCH_MATCH_STATE;
    }

    const search = (editor as AceEditorWithSearch).$search;

    if (!search) {
        return EMPTY_WORKSPACE_EDITOR_SEARCH_MATCH_STATE;
    }

    search.set(buildWorkspaceEditorSearchOptions(searchState));

    const matchRanges = search.findAll(editor.session);

    if (matchRanges.length === 0) {
        return EMPTY_WORKSPACE_EDITOR_SEARCH_MATCH_STATE;
    }

    const activeMatchOrdinal =
        matchRanges.findIndex((range) =>
            areAceRangesEqual(range, editor.selection.getRange()),
        ) + 1;

    return {
        activeMatchOrdinal: activeMatchOrdinal > 0 ? activeMatchOrdinal : 0,
        matchCount: matchRanges.length,
    };
}

function getSearchSeed(editor: AceEditorInstance | null): string {
    if (!editor) {
        return "";
    }

    const selectedText = editor.getSelectedText();

    if (selectedText.trim().length > 0) {
        return selectedText;
    }

    const cursor = editor.getCursorPosition();
    const wordRange = editor.session.getWordRange(cursor.row, cursor.column);
    const word = editor.session.getTextRange(wordRange);

    return word.trim().length > 0 ? word : "";
}

function pruneSearchStateByOpenTabs(
    searchStateByTabId: SearchStateByTabId,
    openTabIds: Set<string>,
): SearchStateByTabId {
    let hasRemovedClosedTab = false;
    const nextSearchStateByTabId = new Map<
        string,
        WorkspaceEditorSearchState
    >();

    for (const [tabId, searchState] of searchStateByTabId) {
        if (!openTabIds.has(tabId)) {
            hasRemovedClosedTab = true;
            continue;
        }

        nextSearchStateByTabId.set(tabId, searchState);
    }

    return hasRemovedClosedTab ? nextSearchStateByTabId : searchStateByTabId;
}

/**
 * Manages Ace editor search state per workspace tab with toggle, query, and replace.
 *
 * @remarks
 * Maintains search state by tab ID, syncs match state with the active editor,
 * handles search toggle (seeding from selection or word), and provides
 * find/replace operations with keyboard shortcut integration.
 */
export function useWorkspaceEditorSearch({
    activeTabId,
    tabs,
    getActiveEditor,
    closeCompletionPopup,
}: UseWorkspaceEditorSearchOptions): UseWorkspaceEditorSearchResult {
    const [searchStateByTabId, setSearchStateByTabId] = useState(
        () => new Map<string, WorkspaceEditorSearchState>(),
    );
    const [focusRequestKey, setFocusRequestKey] = useState(0);
    const activeTabIdRef = useRef(activeTabId);
    const searchStateByTabIdRef = useRef(searchStateByTabId);
    const getActiveEditorRef = useRef(getActiveEditor);
    const closeCompletionPopupRef = useRef(closeCompletionPopup);

    activeTabIdRef.current = activeTabId;
    searchStateByTabIdRef.current = searchStateByTabId;
    getActiveEditorRef.current = getActiveEditor;
    closeCompletionPopupRef.current = closeCompletionPopup;

    const activeSearchState = activeTabId
        ? (searchStateByTabId.get(activeTabId) ??
          createWorkspaceEditorSearchState())
        : createWorkspaceEditorSearchState();
    const validationError = getWorkspaceEditorSearchValidationError(
        activeSearchState.query,
        activeSearchState.isRegex,
    );
    const canSearch = canRunWorkspaceEditorSearch(activeSearchState);

    useEffect(() => {
        const openTabIds = new Set(tabs.map((tab) => tab.id));

        setSearchStateByTabId((currentSearchStateByTabId) =>
            pruneSearchStateByOpenTabs(currentSearchStateByTabId, openTabIds),
        );
    }, [tabs]);

    const updateActiveSearchState = useCallback(
        (
            update:
                | WorkspaceEditorSearchState
                | ((
                      currentSearchState: WorkspaceEditorSearchState,
                  ) => WorkspaceEditorSearchState),
        ): void => {
            const currentActiveTabId = activeTabIdRef.current;

            if (!currentActiveTabId) {
                return;
            }

            setSearchStateByTabId((currentSearchStateByTabId) => {
                const nextSearchStateByTabId = new Map(
                    currentSearchStateByTabId,
                );
                const currentSearchState =
                    currentSearchStateByTabId.get(currentActiveTabId) ??
                    createWorkspaceEditorSearchState();
                const nextSearchState =
                    typeof update === "function"
                        ? update(currentSearchState)
                        : update;

                nextSearchStateByTabId.set(currentActiveTabId, nextSearchState);
                return nextSearchStateByTabId;
            });
        },
        [],
    );

    const syncActiveSearchMatchState = useCallback(
        (
            searchState: WorkspaceEditorSearchState,
            editor: AceEditorInstance | null = getActiveEditorRef.current(),
        ): void => {
            const nextMatchState = editor
                ? getWorkspaceEditorSearchMatchState(editor, searchState)
                : EMPTY_WORKSPACE_EDITOR_SEARCH_MATCH_STATE;

            updateActiveSearchState((currentSearchState) => {
                if (
                    currentSearchState.matchCount ===
                        nextMatchState.matchCount &&
                    currentSearchState.activeMatchOrdinal ===
                        nextMatchState.activeMatchOrdinal
                ) {
                    return currentSearchState;
                }

                return {
                    ...currentSearchState,
                    ...nextMatchState,
                };
            });
        },
        [updateActiveSearchState],
    );

    const runSearch = useCallback(
        (nextSearchState: WorkspaceEditorSearchState): void => {
            const editor = getActiveEditorRef.current();

            if (!editor) {
                return;
            }

            if (!canRunWorkspaceEditorSearch(nextSearchState)) {
                syncActiveSearchMatchState(nextSearchState, editor);
                return;
            }

            editor.find(buildWorkspaceEditorSearchOptions(nextSearchState));
            syncActiveSearchMatchState(nextSearchState, editor);
        },
        [syncActiveSearchMatchState],
    );

    useEffect(() => {
        if (!activeSearchState.isOpen) {
            return;
        }

        syncActiveSearchMatchState(activeSearchState);
    }, [activeSearchState, syncActiveSearchMatchState]);

    const toggleSearch = useCallback((): void => {
        const currentActiveTabId = activeTabIdRef.current;

        if (!currentActiveTabId) {
            return;
        }

        closeCompletionPopupRef.current();

        const editor = getActiveEditorRef.current();
        const currentSearchState =
            searchStateByTabIdRef.current.get(currentActiveTabId) ??
            createWorkspaceEditorSearchState();
        const seededQuery = getSearchSeed(editor);

        setSearchStateByTabId((currentSearchStateByTabId) => {
            const nextSearchStateByTabId = new Map(currentSearchStateByTabId);
            const nextSearchState =
                currentSearchStateByTabId.get(currentActiveTabId) ??
                createWorkspaceEditorSearchState();

            if (nextSearchState.isOpen) {
                nextSearchStateByTabId.set(currentActiveTabId, {
                    ...nextSearchState,
                    isOpen: false,
                });
                return nextSearchStateByTabId;
            }

            nextSearchStateByTabId.set(currentActiveTabId, {
                ...nextSearchState,
                isOpen: true,
                query:
                    nextSearchState.query.length > 0
                        ? nextSearchState.query
                        : seededQuery,
            });

            return nextSearchStateByTabId;
        });

        if (currentSearchState.isOpen) {
            getActiveEditorRef.current()?.focus();
            return;
        }

        setFocusRequestKey(
            (currentFocusRequestKey) => currentFocusRequestKey + 1,
        );
    }, []);

    const handleClose = useCallback((): void => {
        updateActiveSearchState((currentSearchState) => ({
            ...currentSearchState,
            isOpen: false,
        }));
        getActiveEditorRef.current()?.focus();
    }, [updateActiveSearchState]);

    const handleQueryChange = useCallback(
        (value: string): void => {
            const nextSearchState = {
                ...activeSearchState,
                isOpen: true,
                query: value,
            };

            updateActiveSearchState(nextSearchState);
            runSearch(nextSearchState);
        },
        [activeSearchState, runSearch, updateActiveSearchState],
    );

    const handleReplaceValueChange = useCallback(
        (value: string): void => {
            updateActiveSearchState((currentSearchState) => ({
                ...currentSearchState,
                replaceValue: value,
            }));
        },
        [updateActiveSearchState],
    );

    const updateSearchToggle = useCallback(
        (
            update: (
                currentSearchState: WorkspaceEditorSearchState,
            ) => WorkspaceEditorSearchState,
        ): void => {
            const nextSearchState = update(activeSearchState);

            updateActiveSearchState(nextSearchState);
            runSearch(nextSearchState);
        },
        [activeSearchState, runSearch, updateActiveSearchState],
    );

    const buildSearchOptions =
        useCallback((): Partial<Ace.SearchOptions> | null => {
            if (!canSearch) {
                return null;
            }

            return buildWorkspaceEditorSearchOptions(activeSearchState);
        }, [activeSearchState, canSearch]);

    const handleFindNext = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.findNext(searchOptions);
        syncActiveSearchMatchState(activeSearchState, editor);
    }, [activeSearchState, buildSearchOptions, syncActiveSearchMatchState]);

    const handleFindPrevious = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.findPrevious(searchOptions);
        syncActiveSearchMatchState(activeSearchState, editor);
    }, [activeSearchState, buildSearchOptions, syncActiveSearchMatchState]);

    const handleReplaceNext = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.replace(activeSearchState.replaceValue, searchOptions);
        syncActiveSearchMatchState(activeSearchState, editor);
    }, [activeSearchState, buildSearchOptions, syncActiveSearchMatchState]);

    const handleReplaceAll = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.replaceAll(activeSearchState.replaceValue, searchOptions);
        syncActiveSearchMatchState(activeSearchState, editor);
    }, [activeSearchState, buildSearchOptions, syncActiveSearchMatchState]);

    return {
        toggleSearch,
        searchPanel: {
            state: activeSearchState,
            canSearch,
            validationError,
            focusRequestKey,
            onToggle: toggleSearch,
            onQueryChange: handleQueryChange,
            onReplaceValueChange: handleReplaceValueChange,
            onToggleCaseSensitive: () => {
                updateSearchToggle((currentSearchState) => ({
                    ...currentSearchState,
                    isCaseSensitive: !currentSearchState.isCaseSensitive,
                }));
            },
            onToggleWholeWord: () => {
                updateSearchToggle((currentSearchState) => ({
                    ...currentSearchState,
                    isWholeWord: !currentSearchState.isWholeWord,
                }));
            },
            onToggleRegex: () => {
                updateSearchToggle((currentSearchState) => ({
                    ...currentSearchState,
                    isRegex: !currentSearchState.isRegex,
                }));
            },
            onFindNext: handleFindNext,
            onFindPrevious: handleFindPrevious,
            onReplaceNext: handleReplaceNext,
            onReplaceAll: handleReplaceAll,
            onClose: handleClose,
        },
    };
}
