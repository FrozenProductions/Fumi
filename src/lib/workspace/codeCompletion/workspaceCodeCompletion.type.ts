import type {
    AppIntellisensePriority,
    AppIntellisenseWidth,
} from "../../app/app.type";
import type { LuauCompletionPopupState } from "../../luau/luau.type";
import type { LuauFileAnalysis } from "../../luau/symbolScanner/symbolScanner.type";
import type { WorkspaceEditorSearchController } from "../editor/editorSearch.type";
import type { WorkspaceCursorState, WorkspaceTab } from "../workspace.type";
import type { AceChangeDelta } from "./ace.type";

export type UseWorkspaceCodeCompletionOptions = {
    activeEditorMode: string;
    activeLuauAnalysis: LuauFileAnalysis | null;
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
    createHandleEditorUnmount: (tabId: string) => () => void;
    createHandleScroll: (tabId: string) => (editor: unknown) => void;
    acceptCompletion: (completionIndex: number) => void;
    goToLine: (lineNumber: number) => boolean;
};

export type UpdateWorkspaceCompletionPopupOptions = {
    forceOpen?: boolean;
    preserveSelection?: boolean;
};
