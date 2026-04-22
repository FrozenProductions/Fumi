import type { MutableRefObject } from "react";
import type {
    AppIntellisensePriority,
    AppIntellisenseWidth,
} from "../../../lib/app/app.type";
import type { LuauCompletionPopupState } from "../../../lib/luau/luau.type";
import type { LuauFileAnalysis } from "../../../lib/luau/symbolScanner.type";
import type { AceEditorInstance } from "../../../lib/workspace/codeCompletion/ace.type";
import type { UpdateWorkspaceCompletionPopupOptions } from "../../../lib/workspace/codeCompletion/workspaceCodeCompletion.type";

export type UseWorkspaceCompletionPopupOptions = {
    activeEditorMode: string;
    getActiveEditor: () => AceEditorInstance | null;
    getActiveLuauAnalysis: () => LuauFileAnalysis | null;
    isIntellisenseEnabled: boolean;
    intellisensePriority: AppIntellisensePriority;
    intellisenseWidth: AppIntellisenseWidth;
    suppressNextPassiveCompletionRef: MutableRefObject<boolean>;
};

export type UseWorkspaceCompletionPopupResult = {
    completionPopup: LuauCompletionPopupState | null;
    closeCompletionPopup: () => void;
    repositionCompletionPopup: () => void;
    updateCompletionPopup: (
        options?: UpdateWorkspaceCompletionPopupOptions,
    ) => void;
    acceptCompletion: (completionIndex: number) => void;
    handleCompletionHover: (index: number) => void;
};
