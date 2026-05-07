import type {
    CSSProperties,
    PointerEvent as ReactPointerEvent,
    RefObject,
} from "react";
import type { AppEditorTabSize, AppTheme } from "../../../lib/app/app.type";
import type { AppSidebarPosition } from "../../../lib/app/sidebar.type";
import type { LoadedAceRuntime } from "../../../lib/luau/ace/loadAceRuntime.type";
import type {
    LuauCompletionItem,
    LuauCompletionPopupPosition,
    LuauFileSymbol,
} from "../../../lib/luau/luau.type";
import type { UseWorkspaceCodeCompletionResult } from "../../../lib/workspace/codeCompletion/workspaceCodeCompletion.type";
import type { AceEditorComponent } from "../../../lib/workspace/editor/editor.type";
import type { WorkspaceEditorSearchController } from "../../../lib/workspace/editor/editorSearch.type";
import type { WorkspaceOutlineChange } from "../../../lib/workspace/outline/outline.type";
import type {
    WorkspacePaneId,
    WorkspaceSplitView,
    WorkspaceTab,
} from "../../../lib/workspace/workspace.type";
import type { WorkspaceActionsButtonProps } from "../workspaceScreen.type";

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
    isTabsToSpacesEnabled: boolean;
    tabSize: AppEditorTabSize;
    tabs: WorkspaceTab[];
    searchPanel: WorkspaceEditorSearchController;
    workspaceActionsButton: WorkspaceActionsButtonProps;
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

export type WorkspaceAcePaneProps = {
    AceEditorComponent: AceEditorComponent;
    aceRuntime: LoadedAceRuntime;
    appTheme: WorkspaceEditorPaneProps["appTheme"];
    createHandleEditorChange: WorkspaceEditorCompletionProps["createHandleEditorChange"];
    createHandleEditorLoad: WorkspaceEditorCompletionProps["createHandleEditorLoad"];
    createHandleEditorUnmount: WorkspaceEditorCompletionProps["createHandleEditorUnmount"];
    createHandleScroll: WorkspaceEditorCompletionProps["createHandleScroll"];
    editorFontSize: number;
    isWordWrapEnabled: boolean;
    isTabsToSpacesEnabled: boolean;
    isActiveTab: boolean;
    isVisible: boolean;
    onActiveTabLuauChange: WorkspaceEditorOutlineProps["onActiveTabLuauChange"];
    tab: WorkspaceEditorPaneProps["tabs"][number];
    tabSize: AppEditorTabSize;
};

export type WorkspaceEditorSurfaceProps = {
    completion: WorkspaceEditorCompletionProps;
    outline: Pick<WorkspaceEditorOutlineProps, "onActiveTabLuauChange">;
    pane: WorkspaceEditorPaneProps;
    splitViewState: Pick<WorkspaceEditorSplitViewProps, "onFocusPane">;
    surface: {
        refs: {
            editorContainerRef: RefObject<HTMLDivElement | null>;
            leftDropRef: (element: HTMLDivElement | null) => void;
            rightDropRef: (element: HTMLDivElement | null) => void;
        };
        state: {
            AceEditorComponent: AceEditorComponent | null;
            aceRuntime: LoadedAceRuntime | null;
            isAceReady: boolean;
            isDropTarget: {
                left: boolean;
                right: boolean;
            };
            isSplit: boolean;
            primaryTabId: string | null;
            secondaryTabId: string | null;
            splitDividerStyle: CSSProperties;
            tabs: WorkspaceEditorPaneProps["tabs"];
            visibleTabIds: Set<string | null>;
            workspaceActionsClassName: string;
            workspaceActionsStyle: CSSProperties;
        };
        actions: {
            getTabLayoutClass: (tabId: string) => string;
            getTabLayoutStyle: (tabId: string) => CSSProperties | undefined;
            handleSplitResizePointerDown: (
                event: ReactPointerEvent<HTMLButtonElement>,
            ) => void;
        };
    };
};

export type WorkspaceSplitDropZoneProps = {
    alignment: "left" | "right";
    dropRef: (element: HTMLDivElement | null) => void;
    isDropTarget: boolean;
};
