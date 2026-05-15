import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { LuauCompletionPopupState } from "../../../lib/luau/luau.type";
import type { AceEditorInstance } from "../../../lib/workspace/codeCompletion/ace.type";
import type { UpdateWorkspaceCompletionPopupOptions } from "../../../lib/workspace/codeCompletion/workspaceCodeCompletion.type";

export type WorkspaceCompletionPopupKeyboardOptions = {
    acceptCompletion: (completionIndex: number) => void;
    activeEditorMode: string;
    completionPopup: LuauCompletionPopupState | null;
    getActiveEditor: () => AceEditorInstance | null;
    isIntellisenseEnabled: boolean;
    setCompletionPopup: Dispatch<
        SetStateAction<LuauCompletionPopupState | null>
    >;
    suppressNextPassiveCompletionRef: MutableRefObject<boolean>;
    updateCompletionPopup: (
        options?: UpdateWorkspaceCompletionPopupOptions,
    ) => void;
};
