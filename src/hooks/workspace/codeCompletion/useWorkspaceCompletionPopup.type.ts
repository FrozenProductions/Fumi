import type { MutableRefObject } from "react";
import type {
    AppIntellisensePriority,
    AppIntellisenseWidth,
} from "../../../lib/app/app.type";
import type { LuauCompletionPopupState } from "../../../lib/luau/luau.type";
import type { AceEditorInstance } from "./ace.type";
import type { UpdateWorkspaceCompletionPopupOptions } from "./workspaceCodeCompletion.type";

export type UseWorkspaceCompletionPopupOptions = {
    activeEditorMode: string;
    getActiveEditor: () => AceEditorInstance | null;
    isIntellisenseEnabled: boolean;
    intellisensePriority: AppIntellisensePriority;
    intellisenseWidth: AppIntellisenseWidth;
    suppressNextPassiveCompletionRef: MutableRefObject<boolean>;
};

export type UseWorkspaceCompletionPopupResult = {
    completionPopup: LuauCompletionPopupState | null;
    closeCompletionPopup: () => void;
    updateCompletionPopup: (
        options?: UpdateWorkspaceCompletionPopupOptions,
    ) => void;
    acceptCompletion: (completionIndex: number) => void;
    handleCompletionHover: (index: number) => void;
};
