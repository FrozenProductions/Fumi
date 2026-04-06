import type {
    WorkspaceEditorSearchController,
    WorkspaceEditorSearchState,
} from "../../lib/workspace/editorSearch.type";
import type { WorkspaceTab } from "../../lib/workspace/workspace.type";
import type { AceEditorInstance } from "./codeCompletion/ace.type";

export type UseWorkspaceEditorSearchOptions = {
    activeTabId: string | null;
    tabs: WorkspaceTab[];
    getActiveEditor: () => AceEditorInstance | null;
    closeCompletionPopup: () => void;
};

export type UseWorkspaceEditorSearchResult = {
    toggleSearch: () => void;
    searchPanel: WorkspaceEditorSearchController;
};

export type SearchStateByTabId = Map<string, WorkspaceEditorSearchState>;
