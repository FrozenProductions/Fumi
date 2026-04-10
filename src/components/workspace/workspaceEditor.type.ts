import type { UseWorkspaceCodeCompletionResult } from "../../hooks/workspace/codeCompletion/workspaceCodeCompletion.type";
import type { AppTheme } from "../../lib/app/app.type";
import type {
    LuauCompletionItem,
    LuauCompletionPopupPosition,
} from "../../lib/luau/luau.type";
import type { WorkspaceEditorSearchController } from "../../lib/workspace/editorSearch.type";
import type {
    WorkspacePaneId,
    WorkspaceSplitView,
    WorkspaceTab,
} from "../../lib/workspace/workspace.type";

export type AppCodeCompletionProps = {
    items: LuauCompletionItem[];
    selectedIndex: number;
    position: LuauCompletionPopupPosition;
    onHoverItem: (index: number) => void;
    onSelectItem: (index: number) => void;
};

export type WorkspaceEditorProps = {
    activeTabId: string;
    appTheme: AppTheme;
    editorFontSize: number;
    tabs: WorkspaceTab[];
    splitView: WorkspaceSplitView | null;
    searchPanel: WorkspaceEditorSearchController;
    onFocusPane: (pane: WorkspacePaneId) => void;
    onResizeSplitPreview: (splitRatio: number) => void;
    onResizeSplitCommit: (splitRatio: number) => void;
    onResizeSplitCancel: () => void;
} & Pick<
    UseWorkspaceCodeCompletionResult,
    | "acceptCompletion"
    | "completionPopup"
    | "createHandleCursorChange"
    | "createHandleEditorChange"
    | "createHandleEditorLoad"
    | "createHandleScroll"
    | "handleCompletionHover"
>;

export type WorkspaceEditorSearchPanelProps = {
    searchPanel: WorkspaceEditorSearchController;
};
