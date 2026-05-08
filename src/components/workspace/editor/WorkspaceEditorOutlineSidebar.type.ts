import type {
    CSSProperties,
    PointerEvent as ReactPointerEvent,
} from "react";
import type { WorkspaceEditorOutlineProps } from "./WorkspaceEditorProps.type";

export type WorkspaceEditorOutlineSidebarProps = {
    handleOutlineResizePointerDown: (
        event: ReactPointerEvent<HTMLButtonElement>,
    ) => void;
    handleSelectSymbol: (
        symbol: WorkspaceEditorOutlineProps["luauSymbols"][number],
    ) => void;
    outline: WorkspaceEditorOutlineProps;
    sidebar: {
        isOutlinePanelSupported: boolean;
        outlinePanelClassName: string;
        outlinePanelStyle: CSSProperties;
    };
};
