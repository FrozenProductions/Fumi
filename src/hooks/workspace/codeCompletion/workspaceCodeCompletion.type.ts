import type {
    AppIntellisensePriority,
    AppIntellisenseWidth,
} from "../../../lib/app/app.type";
import type { LuauCompletionPopupState } from "../../../lib/luau/luau.type";
import type { WorkspaceEditorSearchController } from "../../../lib/workspace/editorSearch.type";
import type {
    WorkspaceCursorState,
    WorkspaceTab,
} from "../../../lib/workspace/workspace.type";
import type { AceChangeDelta } from "./ace.type";

export type UseWorkspaceCodeCompletionOptions = {
    activeEditorMode: string;
    activeTabId: string | null;
    tabs: WorkspaceTab[];
    isIntellisenseEnabled: boolean;
    intellisensePriority: AppIntellisensePriority;
    intellisenseWidth: AppIntellisenseWidth;
    saveActiveWorkspaceTab: () => Promise<void>;
    updateActiveTabContent: (content: string) => void;
    updateActiveTabCursor: (cursor: WorkspaceCursorState) => void;
    updateActiveTabScrollTop: (scrollTop: number) => void;
};

export type UseWorkspaceCodeCompletionResult = {
    completionPopup: LuauCompletionPopupState | null;
    searchPanel: WorkspaceEditorSearchController;
    handleCompletionHover: (index: number) => void;
    createHandleCursorChange: (tabId: string) => (selection: unknown) => void;
    createHandleEditorChange: (
        tabId: string,
    ) => (value: string, delta?: AceChangeDelta) => void;
    createHandleEditorLoad: (tabId: string) => (editor: unknown) => void;
    createHandleScroll: (tabId: string) => (editor: unknown) => void;
    acceptCompletion: (completionIndex: number) => void;
};

export type UpdateWorkspaceCompletionPopupOptions = {
    forceOpen?: boolean;
    preserveSelection?: boolean;
};
