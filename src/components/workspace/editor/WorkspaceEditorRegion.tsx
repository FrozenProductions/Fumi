import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";
import { useAppStore } from "../../../hooks/app/useAppStore";
import { useWorkspaceCodeCompletion } from "../../../hooks/workspace/useWorkspaceCodeCompletion";
import { useWorkspaceLuauAnalysis } from "../../../hooks/workspace/useWorkspaceLuauAnalysis";
import { useWorkspaceStore } from "../../../hooks/workspace/useWorkspaceStore";
import { getEditorModeForFileName } from "../../../lib/luau/fileType";
import type { WorkspaceOutlineChange } from "../../../lib/workspace/outline/outline.type";
import type { WorkspaceSplitView } from "../../../lib/workspace/session/sessionSplitView.type";
import { selectWorkspaceActiveTab } from "../../../lib/workspace/store/selectors";
import type { WorkspaceActionsButtonProps } from "../workspaceScreen.type";
import { WorkspaceEditor } from "./WorkspaceEditor";
import type { WorkspaceEditorPaneTabBarProps } from "./WorkspaceEditorProps.type";

const EMPTY_WORKSPACE_TABS = [] as const;

type WorkspaceEditorRegionProps = {
    splitView: WorkspaceSplitView | null;
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
    workspaceActionsButton: WorkspaceActionsButtonProps;
    tabBar: WorkspaceEditorPaneTabBarProps;
};

/**
 * Wires editor, completion, outline, and split-view state into the shared WorkspaceEditor.
 *
 * @param props - Component props
 */
export function WorkspaceEditorRegion({
    splitView,
    onResizeSplitPreview,
    onResizeSplitCommit,
    onResizeSplitCancel,
    workspaceActionsButton,
    tabBar,
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
    const updateWorkspaceTabContent = useWorkspaceStore(
        (state) => state.updateWorkspaceTabContent,
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
    const selectWorkspaceTab = useWorkspaceStore(
        (state) => state.selectWorkspaceTab,
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
    const resolvedActiveTabId = activeTabId ?? "";
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
        updateWorkspaceTabContent,
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

    const pane = useMemo(
        () => ({
            activeTabId: resolvedActiveTabId,
            appTheme,
            cursorStyle: editorSettings.cursorStyle,
            editorFontSize: editorSettings.fontSize,
            isSmoothCaretEnabled: editorSettings.isSmoothCaretEnabled,
            isScopeHighlightingEnabled:
                editorSettings.isScopeHighlightingEnabled,
            isRelativeLineNumbersEnabled:
                editorSettings.isRelativeLineNumbersEnabled,
            isWordWrapEnabled: editorSettings.isWordWrapEnabled,
            isTabsToSpacesEnabled: editorSettings.isTabsToSpacesEnabled,
            tabSize: editorSettings.tabSize,
            tabs: resolvedTabs,
            searchPanel,
            tabBar,
            workspaceActionsButton,
            onSelectTab: selectWorkspaceTab,
        }),
        [
            resolvedActiveTabId,
            appTheme,
            editorSettings.cursorStyle,
            editorSettings.fontSize,
            editorSettings.isRelativeLineNumbersEnabled,
            editorSettings.isScopeHighlightingEnabled,
            editorSettings.isSmoothCaretEnabled,
            editorSettings.isTabsToSpacesEnabled,
            editorSettings.isWordWrapEnabled,
            editorSettings.tabSize,
            resolvedTabs,
            searchPanel,
            selectWorkspaceTab,
            tabBar,
            workspaceActionsButton,
        ],
    );
    const completion = useMemo(
        () => ({
            acceptCompletion,
            completionPopup,
            createHandleEditorChange,
            createHandleEditorLoad,
            createHandleEditorUnmount,
            createHandleScroll,
            handleCompletionHover,
        }),
        [
            acceptCompletion,
            completionPopup,
            createHandleEditorChange,
            createHandleEditorLoad,
            createHandleEditorUnmount,
            createHandleScroll,
            handleCompletionHover,
        ],
    );
    const outline = useMemo(
        () => ({
            isOutlinePanelVisible: editorSettings.isOutlinePanelVisible,
            sidebarPosition,
            luauSymbols,
            outlinePanelWidth: editorSettings.outlinePanelWidth,
            outlineExpandedGroups: editorSettings.outlineExpandedGroups,
            outlineSearchQuery: editorSettings.outlineSearchQuery,
            onToggleExpandedGroup: handleToggleOutlineExpandedGroup,
            onExpandAllGroups: handleExpandAllOutlineGroups,
            onCollapseAllGroups: handleCollapseAllOutlineGroups,
            onOutlineSearchQueryChange: setOutlineSearchQuery,
            onActiveTabLuauChange: handleActiveTabLuauChange,
            onSetOutlinePanelWidth: setOutlinePanelWidth,
            goToLine,
        }),
        [
            editorSettings.isOutlinePanelVisible,
            editorSettings.outlineExpandedGroups,
            editorSettings.outlinePanelWidth,
            editorSettings.outlineSearchQuery,
            goToLine,
            handleActiveTabLuauChange,
            handleCollapseAllOutlineGroups,
            handleExpandAllOutlineGroups,
            handleToggleOutlineExpandedGroup,
            luauSymbols,
            setOutlinePanelWidth,
            setOutlineSearchQuery,
            sidebarPosition,
        ],
    );
    const splitViewState = useMemo(
        () => ({
            splitView,
            onFocusPane: focusWorkspacePane,
            onResizeSplitPreview,
            onResizeSplitCommit,
            onResizeSplitCancel,
        }),
        [
            focusWorkspacePane,
            onResizeSplitCancel,
            onResizeSplitCommit,
            onResizeSplitPreview,
            splitView,
        ],
    );

    if (!activeTabId) {
        return null;
    }

    return (
        <WorkspaceEditor
            pane={pane}
            completion={completion}
            outline={outline}
            splitViewState={splitViewState}
        />
    );
}
