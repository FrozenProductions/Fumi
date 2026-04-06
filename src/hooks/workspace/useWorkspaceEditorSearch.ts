import type { Ace } from "ace-builds";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    buildWorkspaceEditorSearchOptions,
    canRunWorkspaceEditorSearch,
    createWorkspaceEditorSearchState,
    getWorkspaceEditorSearchValidationError,
} from "../../lib/workspace/editorSearch";
import type { WorkspaceEditorSearchState } from "../../lib/workspace/editorSearch.type";
import type { AceEditorInstance } from "./codeCompletion/ace.type";
import type {
    SearchStateByTabId,
    UseWorkspaceEditorSearchOptions,
    UseWorkspaceEditorSearchResult,
} from "./useWorkspaceEditorSearch.type";

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
    const getActiveEditorRef = useRef(getActiveEditor);
    const closeCompletionPopupRef = useRef(closeCompletionPopup);

    activeTabIdRef.current = activeTabId;
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

    const runSearch = useCallback(
        (nextSearchState: WorkspaceEditorSearchState): void => {
            const editor = getActiveEditorRef.current();

            if (!editor || !canRunWorkspaceEditorSearch(nextSearchState)) {
                return;
            }

            editor.find(buildWorkspaceEditorSearchOptions(nextSearchState));
        },
        [],
    );

    const openSearch = useCallback((): void => {
        const currentActiveTabId = activeTabIdRef.current;

        if (!currentActiveTabId) {
            return;
        }

        closeCompletionPopupRef.current();

        const editor = getActiveEditorRef.current();
        const seededQuery = getSearchSeed(editor);

        setSearchStateByTabId((currentSearchStateByTabId) => {
            const nextSearchStateByTabId = new Map(currentSearchStateByTabId);
            const currentSearchState =
                currentSearchStateByTabId.get(currentActiveTabId) ??
                createWorkspaceEditorSearchState();

            nextSearchStateByTabId.set(currentActiveTabId, {
                ...currentSearchState,
                isOpen: true,
                query:
                    currentSearchState.query.length > 0
                        ? currentSearchState.query
                        : seededQuery,
            });

            return nextSearchStateByTabId;
        });
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
    }, [buildSearchOptions]);

    const handleFindPrevious = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.findPrevious(searchOptions);
    }, [buildSearchOptions]);

    const handleReplaceNext = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.replace(activeSearchState.replaceValue, searchOptions);
    }, [activeSearchState.replaceValue, buildSearchOptions]);

    const handleReplaceAll = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.replaceAll(activeSearchState.replaceValue, searchOptions);
    }, [activeSearchState.replaceValue, buildSearchOptions]);

    return {
        openSearch,
        searchPanel: {
            state: activeSearchState,
            canSearch,
            validationError,
            focusRequestKey,
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
