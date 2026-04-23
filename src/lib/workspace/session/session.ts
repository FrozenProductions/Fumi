export { clampCursorToContent } from "./sessionCursor";
export {
    getFocusedPaneTabId,
    normalizeSplitView,
    openWorkspaceTabInPaneState,
    removedTabFromSplitView,
    selectWorkspaceTabState,
} from "./sessionSplitView";
export {
    buildWorkspaceSession,
    getActiveTabIndex,
    getNextActiveTabId,
    getWorkspaceDirtyTabCount,
    hasWorkspaceDraftChanges,
    mergeWorkspaceSession,
    reorderWorkspaceTabs,
    serializeTabState,
    updateActiveWorkspaceTab,
    updateWorkspaceTab,
    upsertWorkspaceTab,
} from "./tabs/sessionTabs";
