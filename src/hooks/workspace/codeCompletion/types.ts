import type { AppIntellisensePriority } from "../../../types/app/settings";
import type { LuauCompletionPopupState } from "../../../types/luau/editor";
import type { WorkspaceTab } from "../../../types/workspace/session";
import type { WorkspaceCursorState } from "../../../types/workspace/workspace";
import type { AceChangeDelta } from "./ace";

export type UseWorkspaceCodeCompletionOptions = {
    activeEditorMode: string;
    activeTabId: string | null;
    tabs: WorkspaceTab[];
    isIntellisenseEnabled: boolean;
    intellisensePriority: AppIntellisensePriority;
    saveActiveWorkspaceTab: () => Promise<void>;
    updateActiveTabContent: (content: string) => void;
    updateActiveTabCursor: (cursor: WorkspaceCursorState) => void;
    updateActiveTabScrollTop: (scrollTop: number) => void;
};

export type UseWorkspaceCodeCompletionResult = {
    completionPopup: LuauCompletionPopupState | null;
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
