import type { Ace } from "ace-builds";
import { useCallback } from "react";
import type { AceEditorInstance } from "../../../lib/workspace/codeCompletion/ace.type";
import { buildWorkspaceEditorSearchOptions } from "../../../lib/workspace/editor/editorSearch";
import type { WorkspaceEditorSearchState } from "../../../lib/workspace/editor/editorSearch.type";

type WorkspaceEditorSearchNavigationOptions = {
    activeSearchState: WorkspaceEditorSearchState;
    canSearch: boolean;
    getActiveEditorRef: {
        current: () => AceEditorInstance | null;
    };
    syncActiveSearchMatchState: (
        searchState: WorkspaceEditorSearchState,
        editor?: AceEditorInstance | null,
    ) => void;
};

/**
 * Provides find-next, find-previous, replace-next, and replace-all actions for the active editor search.
 *
 * @remarks
 * Reads the current search state to build Ace editor search options, then syncs
 * match metadata back after each operation. Returns early if the search query
 * is invalid or no editor is focused.
 *
 * @param options - Active search state, editor accessor, and match-state sync callback
 * @returns Navigation and replacement action handlers
 */
export function useWorkspaceEditorSearchNavigation({
    activeSearchState,
    canSearch,
    getActiveEditorRef,
    syncActiveSearchMatchState,
}: WorkspaceEditorSearchNavigationOptions) {
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
    }, [
        activeSearchState,
        buildSearchOptions,
        syncActiveSearchMatchState,
        getActiveEditorRef.current,
    ]);

    const handleFindPrevious = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.findPrevious(searchOptions);
        syncActiveSearchMatchState(activeSearchState, editor);
    }, [
        activeSearchState,
        buildSearchOptions,
        syncActiveSearchMatchState,
        getActiveEditorRef.current,
    ]);

    const handleReplaceNext = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.replace(activeSearchState.replaceValue, searchOptions);
        syncActiveSearchMatchState(activeSearchState, editor);
    }, [
        activeSearchState,
        buildSearchOptions,
        syncActiveSearchMatchState,
        getActiveEditorRef.current,
    ]);

    const handleReplaceAll = useCallback((): void => {
        const editor = getActiveEditorRef.current();
        const searchOptions = buildSearchOptions();

        if (!editor || !searchOptions) {
            return;
        }

        editor.replaceAll(activeSearchState.replaceValue, searchOptions);
        syncActiveSearchMatchState(activeSearchState, editor);
    }, [
        activeSearchState,
        buildSearchOptions,
        syncActiveSearchMatchState,
        getActiveEditorRef.current,
    ]);

    return {
        handleFindNext,
        handleFindPrevious,
        handleReplaceNext,
        handleReplaceAll,
    };
}
