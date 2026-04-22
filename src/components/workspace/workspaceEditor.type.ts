import type { AppSidebarPosition, AppTheme } from "../../lib/app/app.type";
import type {
    LuauCompletionItem,
    LuauCompletionPopupPosition,
    LuauFileSymbol,
} from "../../lib/luau/luau.type";
import type { UseWorkspaceCodeCompletionResult } from "../../lib/workspace/codeCompletion/workspaceCodeCompletion.type";
import type { WorkspaceEditorSearchController } from "../../lib/workspace/editorSearch.type";
import type { WorkspaceOutlineChange } from "../../lib/workspace/outline.type";
import type {
    WorkspacePaneId,
    WorkspaceSplitView,
    WorkspaceTab,
} from "../../lib/workspace/workspace.type";
import type { WorkspaceActionsButtonProps } from "./workspaceScreen.type";

export type AppCodeCompletionProps = {
    items: LuauCompletionItem[];
    selectedIndex: number;
    position: LuauCompletionPopupPosition;
    onHoverItem: (index: number) => void;
    onSelectItem: (index: number) => void;
};

export type WorkspaceEditorPaneProps = {
    activeTabId: string;
    appTheme: AppTheme;
    editorFontSize: number;
    isWordWrapEnabled: boolean;
    tabs: WorkspaceTab[];
    searchPanel: WorkspaceEditorSearchController;
    workspaceActionsButton: WorkspaceActionsButtonProps;
};

export type WorkspaceEditorCompletionProps = Pick<
    UseWorkspaceCodeCompletionResult,
    | "acceptCompletion"
    | "completionPopup"
    | "createHandleCursorChange"
    | "createHandleEditorChange"
    | "createHandleEditorLoad"
    | "createHandleEditorUnmount"
    | "createHandleScroll"
    | "handleCompletionHover"
>;

export type WorkspaceEditorOutlineProps = {
    isOutlinePanelVisible: boolean;
    sidebarPosition: AppSidebarPosition;
    luauSymbols: LuauFileSymbol[];
    outlinePanelWidth: number;
    outlineExpandedGroups: Record<string, boolean>;
    outlineSearchQuery: string;
    onToggleExpandedGroup: (title: string) => void;
    onExpandAllGroups: (titles: string[]) => void;
    onCollapseAllGroups: (titles: string[]) => void;
    onOutlineSearchQueryChange: (query: string) => void;
    onActiveTabLuauChange: (change: WorkspaceOutlineChange | null) => void;
    onSetOutlinePanelWidth: (width: number) => void;
    goToLine: (lineNumber: number) => boolean;
};

export type WorkspaceEditorSplitViewProps = {
    splitView: WorkspaceSplitView | null;
    onFocusPane: (pane: WorkspacePaneId) => void;
    onResizeSplitPreview: (splitRatio: number) => void;
    onResizeSplitCommit: (splitRatio: number) => void;
    onResizeSplitCancel: () => void;
};

export type WorkspaceEditorProps = {
    pane: WorkspaceEditorPaneProps;
    completion: WorkspaceEditorCompletionProps;
    outline: WorkspaceEditorOutlineProps;
    splitViewState: WorkspaceEditorSplitViewProps;
};

export type WorkspaceEditorSearchPanelProps = {
    searchPanel: WorkspaceEditorSearchController;
};

export type WorkspaceSplitDropZoneProps = {
    alignment: "left" | "right";
    dropRef: (element: HTMLDivElement | null) => void;
    isDropTarget: boolean;
};
