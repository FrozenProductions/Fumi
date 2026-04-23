import type { Ace } from "ace-builds";
import { EMPTY_WORKSPACE_EDITOR_SEARCH_MATCH_STATE } from "../../../constants/workspace/editorSearch";
import type { AceEditorInstance } from "../../../lib/workspace/codeCompletion/ace.type";
import {
    buildWorkspaceEditorSearchOptions,
    canRunWorkspaceEditorSearch,
} from "../../../lib/workspace/editor/editorSearch";
import type {
    AceEditorWithSearch,
    WorkspaceEditorSearchMatchState,
    WorkspaceEditorSearchState,
} from "../../../lib/workspace/editor/editorSearch.type";
import type { SearchStateByTabId } from "./useWorkspaceEditorSearch.type";

function areAcePointsEqual(left: Ace.Point, right: Ace.Point): boolean {
    return left.row === right.row && left.column === right.column;
}

function areAceRangesEqual(left: Ace.Range, right: Ace.Range): boolean {
    return (
        areAcePointsEqual(left.start, right.start) &&
        areAcePointsEqual(left.end, right.end)
    );
}

/**
 * Computes the match count and active match ordinal for the current search state.
 *
 * @param editor - The Ace editor instance
 * @param searchState - The current editor search state
 * @returns The match state with active ordinal and total count, or an empty default
 */
export function getWorkspaceEditorSearchMatchState(
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

/**
 * Extracts a search seed string from the editor — either the selected text or
 * the word under the cursor.
 *
 * @param editor - The Ace editor instance, or null if no editor is available
 * @returns The selected text, the word at the cursor, or an empty string
 */
export function getSearchSeed(editor: AceEditorInstance | null): string {
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

/**
 * Removes search state entries for tabs that are no longer open.
 *
 * @param searchStateByTabId - Map of tab IDs to their search state
 * @param openTabIds - Set of currently open tab IDs
 * @returns The same map if nothing was removed, or a new map with only open tabs
 */
export function pruneSearchStateByOpenTabs(
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
