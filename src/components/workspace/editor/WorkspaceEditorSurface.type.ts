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
    isRelativeLineNumbersEnabled: boolean;
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
    splitViewState: Pick<
        WorkspaceEditorSplitViewProps,
        | "onFocusPane"
        | "onResizeSplitCancel"
        | "onResizeSplitCommit"
        | "onResizeSplitPreview"
        | "splitView"
    >;
    surface: {
        refs: {
            editorContainerRef: RefObject<HTMLDivElement | null>;
        };
        state: {
            AceEditorComponent: AceEditorComponent | null;
            aceRuntime: LoadedAceRuntime | null;
            isAceReady: boolean;
            isOutlinePanelSupported: boolean;
            outlinePanelClassName: string;
            outlinePanelStyle: CSSProperties;
            tabs: WorkspaceEditorPaneProps["tabs"];
            workspaceActionsClassName: string;
            workspaceActionsStyle: CSSProperties;
        };
        actions: {
            handleOutlineResizePointerDown: (
                event: ReactPointerEvent<HTMLButtonElement>,
            ) => void;
        };
    };
};
