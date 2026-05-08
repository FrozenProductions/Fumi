import type {
    CSSProperties,
    PointerEvent as ReactPointerEvent,
    RefObject,
} from "react";
import type {
    AppEditorCursorStyle,
    AppEditorTabSize,
} from "../../../lib/app/app.type";
import type { LoadedAceRuntime } from "../../../lib/luau/ace/loadAceRuntime.type";
import type { AceEditorComponent } from "../../../lib/workspace/editor/editor.type";
import type {
    WorkspaceEditorCompletionProps,
    WorkspaceEditorOutlineProps,
    WorkspaceEditorPaneProps,
    WorkspaceEditorSplitViewProps,
} from "./WorkspaceEditorProps.type";

export type WorkspaceAcePaneProps = {
    AceEditorComponent: AceEditorComponent;
    aceRuntime: LoadedAceRuntime;
    appTheme: WorkspaceEditorPaneProps["appTheme"];
    createHandleEditorChange: WorkspaceEditorCompletionProps["createHandleEditorChange"];
    createHandleEditorLoad: WorkspaceEditorCompletionProps["createHandleEditorLoad"];
    createHandleEditorUnmount: WorkspaceEditorCompletionProps["createHandleEditorUnmount"];
    createHandleScroll: WorkspaceEditorCompletionProps["createHandleScroll"];
    cursorStyle: AppEditorCursorStyle;
    editorFontSize: number;
    isSmoothCaretEnabled: boolean;
    isScopeHighlightingEnabled: boolean;
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
