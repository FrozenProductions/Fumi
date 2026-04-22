import type { ReactElement } from "react";
import { useCallback } from "react";
import { useWorkspaceEditorSurface } from "../../../hooks/workspace/useWorkspaceEditorSurface";
import type { LuauFileSymbol } from "../../../lib/luau/luau.type";
import { getWorkspaceLineNumberFromOffset } from "../../../lib/workspace/outline/outline";
import { WorkspaceEditorOutlineSidebar } from "./WorkspaceEditorOutlineSidebar";
import { WorkspaceEditorSurface } from "./WorkspaceEditorSurface";
import type { WorkspaceEditorProps } from "./workspaceEditor.type";

/**
 * The main workspace editor with tab management, split view, and outline panel.
 *
 * @param props - Component props
 * @param props.activeTabId - Currently active tab ID
 * @param props.appTheme - Current app theme
 * @param props.editorFontSize - Editor font size
 * @param props.tabs - All workspace tabs
 * @param props.splitView - Current split view configuration
 * @param props.searchPanel - Search panel state
 * @param props.completionPopup - Code completion popup state
 * @param props.isOutlinePanelVisible - Whether outline panel is visible
 * @param props.luauSymbols - Luau symbols for outline
 * @returns A React component
 */
export function WorkspaceEditor({
    pane,
    completion,
    outline,
    splitViewState,
}: WorkspaceEditorProps): ReactElement {
    const { goToLine } = outline;

    const handleSelectSymbol = useCallback(
        (symbol: LuauFileSymbol): void => {
            const activeTab =
                pane.tabs.find((tab) => tab.id === pane.activeTabId) ?? null;
            const lineNumber = getWorkspaceLineNumberFromOffset(
                activeTab?.content ?? "",
                symbol.declarationStart,
            );
            goToLine(lineNumber);
        },
        [goToLine, pane.activeTabId, pane.tabs],
    );
    const surface = useWorkspaceEditorSurface({
        outline,
        pane,
        splitViewState,
    });

    return (
        <div className="relative flex min-h-0 flex-1 bg-fumi-50">
            <WorkspaceEditorSurface
                completion={completion}
                outline={outline}
                pane={pane}
                splitViewState={splitViewState}
                surface={surface}
            />
            <WorkspaceEditorOutlineSidebar
                handleOutlineResizePointerDown={
                    surface.actions.handleOutlineResizePointerDown
                }
                handleSelectSymbol={handleSelectSymbol}
                outline={outline}
                sidebar={{
                    isOutlinePanelSupported:
                        surface.state.isOutlinePanelSupported,
                    outlinePanelClassName: surface.state.outlinePanelClassName,
                    outlinePanelStyle: surface.state.outlinePanelStyle,
                }}
            />
        </div>
    );
}
