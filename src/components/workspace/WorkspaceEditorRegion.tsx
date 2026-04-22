import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import { selectWorkspaceActiveTab } from "../../hooks/workspace/store/selectors";
import { useWorkspaceCodeCompletion } from "../../hooks/workspace/useWorkspaceCodeCompletion";
import { useWorkspaceLuauAnalysis } from "../../hooks/workspace/useWorkspaceLuauAnalysis";
import { useWorkspaceStore } from "../../hooks/workspace/useWorkspaceStore";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import type { WorkspaceOutlineChange } from "../../lib/workspace/outline.type";
import type { WorkspaceSplitView } from "../../lib/workspace/workspace.type";
import { WorkspaceEditor } from "./WorkspaceEditor";
import type { WorkspaceActionsButtonProps } from "./workspaceScreen.type";

const EMPTY_WORKSPACE_TABS = [] as const;

type WorkspaceEditorRegionProps = {
    splitView: WorkspaceSplitView | null;
    onResizeSplitPreview: (splitRatio: number) => void;
    onResizeSplitCommit: (splitRatio: number) => void;
    onResizeSplitCancel: () => void;
    workspaceActionsButton: WorkspaceActionsButtonProps;
};

export function WorkspaceEditorRegion({
    splitView,
    onResizeSplitPreview,
    onResizeSplitCommit,
    onResizeSplitCancel,
    workspaceActionsButton,
}: WorkspaceEditorRegionProps): ReactElement | null {
    const appTheme = useAppStore((state) => state.theme);
    const editorSettings = useAppStore((state) => state.editorSettings);
    const sidebarPosition = useAppStore((state) => state.sidebarPosition);
    const setOutlinePanelWidth = useAppStore(
        (state) => state.setOutlinePanelWidth,
    );
    const setOutlineExpandedGroups = useAppStore(
        (state) => state.setOutlineExpandedGroups,
    );
    const setOutlineSearchQuery = useAppStore(
        (state) => state.setOutlineSearchQuery,
    );
    const activeTab = useWorkspaceStore(selectWorkspaceActiveTab);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const saveActiveWorkspaceTab = useWorkspaceStore(
        (state) => state.saveActiveWorkspaceTab,
    );
    const updateActiveTabContent = useWorkspaceStore(
        (state) => state.updateActiveTabContent,
    );
    const updateActiveTabCursor = useWorkspaceStore(
        (state) => state.updateActiveTabCursor,
    );
    const updateActiveTabScrollTop = useWorkspaceStore(
        (state) => state.updateActiveTabScrollTop,
    );
    const focusWorkspacePane = useWorkspaceStore(
        (state) => state.focusWorkspacePane,
    );
    const tabs = workspace?.tabs ?? EMPTY_WORKSPACE_TABS;
    const activeTabId = activeTab?.id ?? null;
    const activeEditorMode = activeTab
        ? getEditorModeForFileName(activeTab.fileName)
        : "text";
    const [latestLuauChangeState, setLatestLuauChangeState] = useState<{
        change: WorkspaceOutlineChange | null;
        tabId: string;
    } | null>(null);
    const latestLuauChange =
        activeTabId && latestLuauChangeState?.tabId === activeTabId
            ? latestLuauChangeState.change
            : null;
    const resolvedTabs = useMemo(() => [...tabs], [tabs]);
    const { analysis: activeLuauAnalysis, symbols: luauSymbols } =
        useWorkspaceLuauAnalysis(
            activeTab,
            editorSettings.isIntellisenseEnabled ||
                editorSettings.isOutlinePanelVisible,
            latestLuauChange,
        );
    const {
        acceptCompletion,
        completionPopup,
        createHandleCursorChange,
        createHandleEditorChange,
        createHandleEditorLoad,
        createHandleEditorUnmount,
        createHandleScroll,
        handleCompletionHover,
        searchPanel,
        goToLine,
    } = useWorkspaceCodeCompletion({
        activeEditorMode,
        activeLuauAnalysis,
        activeTabId,
        tabs: resolvedTabs,
        isIntellisenseEnabled: editorSettings.isIntellisenseEnabled,
        intellisensePriority: editorSettings.intellisensePriority,
        intellisenseWidth: editorSettings.intellisenseWidth,
        saveActiveWorkspaceTab,
        updateActiveTabContent,
        updateActiveTabCursor,
        updateActiveTabScrollTop,
    });

    const handleActiveTabLuauChange = useCallback(
        (change: WorkspaceOutlineChange | null): void => {
            if (!activeTabId) {
                return;
            }

            setLatestLuauChangeState({
                change,
                tabId: activeTabId,
            });
        },
        [activeTabId],
    );

    const handleToggleOutlineExpandedGroup = useCallback(
        (title: string): void => {
            setOutlineExpandedGroups({
                [title]: !editorSettings.outlineExpandedGroups[title],
            });
        },
        [editorSettings.outlineExpandedGroups, setOutlineExpandedGroups],
    );

    const handleExpandAllOutlineGroups = useCallback(
        (titles: string[]): void => {
            setOutlineExpandedGroups(
                Object.fromEntries(titles.map((t) => [t, true])),
            );
        },
        [setOutlineExpandedGroups],
    );

    const handleCollapseAllOutlineGroups = useCallback(
        (titles: string[]): void => {
            setOutlineExpandedGroups(
                Object.fromEntries(titles.map((t) => [t, false])),
            );
        },
        [setOutlineExpandedGroups],
    );

    if (!activeTabId) {
        return null;
    }

    return (
        <WorkspaceEditor
            activeTabId={activeTabId}
            appTheme={appTheme}
            editorFontSize={editorSettings.fontSize}
            isWordWrapEnabled={editorSettings.isWordWrapEnabled}
            tabs={resolvedTabs}
            splitView={splitView}
            searchPanel={searchPanel}
            acceptCompletion={acceptCompletion}
            completionPopup={completionPopup}
            createHandleCursorChange={createHandleCursorChange}
            createHandleEditorChange={createHandleEditorChange}
            createHandleEditorLoad={createHandleEditorLoad}
            createHandleEditorUnmount={createHandleEditorUnmount}
            createHandleScroll={createHandleScroll}
            handleCompletionHover={handleCompletionHover}
            isOutlinePanelVisible={editorSettings.isOutlinePanelVisible}
            sidebarPosition={sidebarPosition}
            luauSymbols={luauSymbols}
            outlinePanelWidth={editorSettings.outlinePanelWidth}
            outlineExpandedGroups={editorSettings.outlineExpandedGroups}
            onToggleExpandedGroup={handleToggleOutlineExpandedGroup}
            onExpandAllGroups={handleExpandAllOutlineGroups}
            onCollapseAllGroups={handleCollapseAllOutlineGroups}
            outlineSearchQuery={editorSettings.outlineSearchQuery}
            onOutlineSearchQueryChange={setOutlineSearchQuery}
            onActiveTabLuauChange={handleActiveTabLuauChange}
            onFocusPane={focusWorkspacePane}
            onSetOutlinePanelWidth={setOutlinePanelWidth}
            onResizeSplitPreview={onResizeSplitPreview}
            onResizeSplitCommit={onResizeSplitCommit}
            onResizeSplitCancel={onResizeSplitCancel}
            goToLine={goToLine}
            workspaceActionsButton={workspaceActionsButton}
        />
    );
}
