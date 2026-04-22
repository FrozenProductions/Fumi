import type {
    CSSProperties,
    ReactElement,
    PointerEvent as ReactPointerEvent,
} from "react";
import { WorkspaceOutlinePanel } from "../outline/WorkspaceOutlinePanel";
import type { WorkspaceEditorOutlineProps } from "./workspaceEditor.type";

type WorkspaceEditorOutlineSidebarProps = {
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

export function WorkspaceEditorOutlineSidebar({
    handleOutlineResizePointerDown,
    handleSelectSymbol,
    outline,
    sidebar,
}: WorkspaceEditorOutlineSidebarProps): ReactElement | null {
    const {
        sidebarPosition,
        luauSymbols,
        outlineExpandedGroups,
        outlineSearchQuery,
        onToggleExpandedGroup,
        onExpandAllGroups,
        onCollapseAllGroups,
        onOutlineSearchQueryChange,
    } = outline;

    if (!sidebar.isOutlinePanelSupported) {
        return null;
    }

    return (
        <div
            className={sidebar.outlinePanelClassName}
            style={sidebar.outlinePanelStyle}
        >
            <button
                type="button"
                aria-label="Resize outline panel"
                className={`absolute inset-y-0 z-30 w-3 cursor-col-resize touch-none bg-transparent focus-visible:outline-none ${
                    sidebarPosition === "right"
                        ? "right-0 translate-x-1/2"
                        : "left-0 -translate-x-1/2"
                }`}
                onPointerDown={handleOutlineResizePointerDown}
            >
                <span className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-fumi-200" />
            </button>
            <div className="flex h-full min-w-0 flex-1">
                <WorkspaceOutlinePanel
                    symbols={luauSymbols}
                    onSelectSymbol={handleSelectSymbol}
                    expandedGroups={outlineExpandedGroups}
                    onToggleExpandedGroup={onToggleExpandedGroup}
                    onExpandAllGroups={onExpandAllGroups}
                    onCollapseAllGroups={onCollapseAllGroups}
                    outlineSearchQuery={outlineSearchQuery}
                    onOutlineSearchQueryChange={onOutlineSearchQueryChange}
                />
            </div>
        </div>
    );
}
