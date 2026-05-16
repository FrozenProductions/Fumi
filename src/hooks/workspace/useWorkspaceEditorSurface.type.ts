import type {
    CSSProperties,
    PointerEvent as ReactPointerEvent,
    RefObject,
} from "react";
import type { WorkspaceEditorPaneProps } from "../../components/workspace/editor/WorkspaceEditorProps.type";
import type { LoadedAceRuntime } from "../../lib/luau/ace/loadAceRuntime.type";
import type { AceEditorComponent } from "../../lib/workspace/editor/editor.type";
import type { WorkspaceScreenTab } from "../../lib/workspace/session/tabs/sessionTabs.type";

export type UseWorkspaceEditorSurfaceResult = {
    refs: {
        editorContainerRef: RefObject<HTMLDivElement | null>;
    };
    state: {
        AceEditorComponent: AceEditorComponent | null;
        aceRuntime: LoadedAceRuntime | null;
        activeTab: WorkspaceEditorPaneProps["tabs"][number] | null;
        editorSurfaceStyle: CSSProperties;
        isAceReady: boolean;
        isOutlinePanelSupported: boolean;
        outlinePanelClassName: string;
        outlinePanelStyle: CSSProperties;
        tabMetadata: WorkspaceScreenTab[];
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

export type WorkspaceEditorRuntimeState = {
    AceEditorComponent: AceEditorComponent | null;
    aceRuntime: LoadedAceRuntime | null;
    isAceReady: boolean;
};
