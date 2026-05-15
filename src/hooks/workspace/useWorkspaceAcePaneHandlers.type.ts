import type { WorkspaceAcePaneProps } from "../../components/workspace/editor/WorkspaceEditorSurface.type";
import type {
    AceChangeDelta,
    AceEditorInstance,
} from "../../lib/workspace/codeCompletion/ace.type";

export type UseWorkspaceAcePaneHandlersOptions = Pick<
    WorkspaceAcePaneProps,
    | "createHandleEditorChange"
    | "createHandleEditorLoad"
    | "createHandleEditorUnmount"
    | "createHandleScroll"
    | "isActiveTab"
    | "isRelativeLineNumbersEnabled"
    | "isTabsToSpacesEnabled"
    | "isVisible"
    | "onActiveTabLuauChange"
    | "tab"
    | "tabSize"
>;

export type UseWorkspaceAcePaneHandlersResult = {
    onBlur: () => void;
    onChange: (value: string, delta?: AceChangeDelta) => void;
    onCursorChange: () => void;
    onFocus: () => void;
    onLoad: (editor: AceEditorInstance) => void;
    onScroll: (editor: AceEditorInstance) => void;
};

export type WorkspaceAcePaneInteractionState = {
    isEditorFocused: boolean;
    isCursorRowVisible: boolean;
};
