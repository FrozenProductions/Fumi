import type {
    AppEditorCursorStyle,
    AppEditorTabSize,
    AppTheme,
} from "../../../lib/app/app.type";
import type { AppSidebarPosition } from "../../../lib/app/sidebar.type";
import type { LuauFileSymbol } from "../../../lib/luau/luau.type";
import type { UseWorkspaceCodeCompletionResult } from "../../../lib/workspace/codeCompletion/workspaceCodeCompletion.type";
import type { WorkspaceEditorSearchController } from "../../../lib/workspace/editor/editorSearch.type";
import type { WorkspaceOutlineChange } from "../../../lib/workspace/outline/outline.type";
import type { WorkspaceScreenSession } from "../../../lib/workspace/session/session.type";
import type { WorkspaceSplitView } from "../../../lib/workspace/session/sessionSplitView.type";
import type { WorkspaceTab } from "../../../lib/workspace/session/tabs/sessionTabs.type";
import type { WorkspaceTabBarInternalProps } from "../tabBar/workspaceTabBar.type";
import type { WorkspaceActionsButtonProps } from "../workspaceScreen.type";

export type WorkspaceEditorPaneTabBarProps = Omit<
    WorkspaceTabBarInternalProps,
    | "workspace"
    | "previewTabs"
    | "splitView"
    | "splitDropTarget"
    | "tabListScopeId"
> & {
    workspaceBase: Omit<WorkspaceScreenSession, "activeTabId" | "tabs"> & {
        splitView: WorkspaceSplitView | null;
    };
};

export type WorkspaceEditorPaneProps = {
    activeTabId: string;
    appTheme: AppTheme;
    cursorStyle: AppEditorCursorStyle;
    editorFontSize: number;
    isSmoothCaretEnabled: boolean;
    isScopeHighlightingEnabled: boolean;
    isRelativeLineNumbersEnabled: boolean;
    isWordWrapEnabled: boolean;
    isTabsToSpacesEnabled: boolean;
    tabSize: AppEditorTabSize;
    tabs: WorkspaceTab[];
    searchPanel: WorkspaceEditorSearchController;
    tabBar: WorkspaceEditorPaneTabBarProps;
    workspaceActionsButton: WorkspaceActionsButtonProps;
    onSelectTab: (tabId: string) => void;
};

export type WorkspaceEditorCompletionProps = Pick<
    UseWorkspaceCodeCompletionResult,
    | "acceptCompletion"
    | "completionPopup"
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
    onFocusPane: (paneId: string) => void;
    onResizeSplitPreview: (
        splitRatio: number,
        splitId: string,
        dividerIndex: number,
    ) => void;
    onResizeSplitCommit: (
        splitRatio: number,
        splitId: string,
        dividerIndex: number,
    ) => void;
    onResizeSplitCancel: () => void;
};

export type WorkspaceEditorProps = {
    pane: WorkspaceEditorPaneProps;
    completion: WorkspaceEditorCompletionProps;
    outline: WorkspaceEditorOutlineProps;
    splitViewState: WorkspaceEditorSplitViewProps;
};
