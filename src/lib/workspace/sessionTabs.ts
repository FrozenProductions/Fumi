import type {
    WorkspaceSession,
    WorkspaceSnapshot,
    WorkspaceTab,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../../lib/workspace/workspace.type";
import { clampCursorToContent } from "./sessionCursor";
import { normalizeSplitView } from "./sessionSplitView";

function createWorkspaceTab(tab: WorkspaceTabSnapshot): WorkspaceTab {
    return {
        ...tab,
        savedContent: tab.content,
        contentRevision: 0,
    };
}

/**
 * Builds a workspace session from a snapshot with clamped cursors and validated split view.
 */
export function buildWorkspaceSession(
    snapshot: WorkspaceSnapshot,
): WorkspaceSession {
    const tabById = new Map(
        snapshot.tabs.map((tab) => [tab.id, createWorkspaceTab(tab)] as const),
    );

    const tabs = snapshot.metadata.tabs
        .map((tabState) => {
            const tab = tabById.get(tabState.id);

            if (!tab) {
                return null;
            }

            return {
                ...tab,
                cursor: clampCursorToContent(tab.content, tabState.cursor),
            };
        })
        .filter((tab): tab is WorkspaceTab => tab !== null);

    const openTabIds = new Set(tabs.map((tab) => tab.id));
    const normalizedSplitView = normalizeSplitView(
        snapshot.metadata.splitView ?? null,
        openTabIds,
    );

    const activeTabId = normalizedSplitView
        ? normalizedSplitView.focusedPane === "primary"
            ? normalizedSplitView.primaryTabId
            : normalizedSplitView.secondaryTabId
        : tabs.some((tab) => tab.id === snapshot.metadata.activeTabId)
          ? snapshot.metadata.activeTabId
          : (tabs[0]?.id ?? null);

    return {
        workspacePath: snapshot.workspacePath,
        workspaceName: snapshot.workspaceName,
        activeTabId,
        splitView: normalizedSplitView,
        tabs,
        archivedTabs: snapshot.metadata.archivedTabs,
        executionHistory: snapshot.metadata.executionHistory,
    };
}

/**
 * Finds the index of the active tab in the tabs array, or -1 if not found.
 */
export function getActiveTabIndex(
    tabs: WorkspaceTab[],
    activeTabId: string | null,
): number {
    if (!activeTabId) {
        return -1;
    }

    return tabs.findIndex((tab) => tab.id === activeTabId);
}

/**
 * Serializes a workspace tab to its persistent state (id, fileName, cursor).
 */
export function serializeTabState(tab: WorkspaceTab): WorkspaceTabState {
    return {
        id: tab.id,
        fileName: tab.fileName,
        cursor: tab.cursor,
    };
}

/**
 * Returns the next active tab ID after closing a tab at the given index.
 *
 * @remarks
 * Prefers the tab at the same index (now shifted), then the previous tab,
 * then the first available tab.
 */
export function getNextActiveTabId(
    tabs: WorkspaceTab[],
    closedTabIndex: number,
): string | null {
    if (tabs.length === 0) {
        return null;
    }

    const nextTab = tabs[closedTabIndex] ?? tabs[closedTabIndex - 1];
    return nextTab?.id ?? tabs[0]?.id ?? null;
}

/**
 * Checks if any workspace tab has unsaved content changes.
 */
export function hasWorkspaceDraftChanges(workspace: WorkspaceSession): boolean {
    return workspace.tabs.some((tab) => tab.content !== tab.savedContent);
}

export function getWorkspaceDirtyTabCount(
    workspace: WorkspaceSession | null,
): number {
    if (!workspace) {
        return 0;
    }

    return workspace.tabs.reduce((count, tab) => {
        return count + Number(tab.content !== tab.savedContent);
    }, 0);
}

/**
 * Inserts or updates a tab in the workspace session.
 *
 * @remarks
 * Removes any archived tab with the same ID, sets the tab as active,
 * and clears the split view.
 */
export function upsertWorkspaceTab(
    currentWorkspace: WorkspaceSession,
    tab: WorkspaceTabSnapshot,
): WorkspaceSession {
    const nextTabs = [
        ...currentWorkspace.tabs.filter(
            (currentTab) => currentTab.id !== tab.id,
        ),
        createWorkspaceTab(tab),
    ];

    return {
        ...currentWorkspace,
        activeTabId: tab.id,
        splitView: null,
        archivedTabs: currentWorkspace.archivedTabs.filter(
            (archivedTab) => archivedTab.id !== tab.id,
        ),
        tabs: nextTabs,
    };
}

/**
 * Reorders workspace tabs by moving a dragged tab to the target position.
 */
export function reorderWorkspaceTabs(
    currentWorkspace: WorkspaceSession,
    draggedTabId: string,
    targetTabId: string,
): WorkspaceSession {
    if (draggedTabId === targetTabId) {
        return currentWorkspace;
    }

    const draggedTabIndex = currentWorkspace.tabs.findIndex(
        (tab) => tab.id === draggedTabId,
    );
    const targetTabIndex = currentWorkspace.tabs.findIndex(
        (tab) => tab.id === targetTabId,
    );

    if (draggedTabIndex < 0 || targetTabIndex < 0) {
        return currentWorkspace;
    }

    const nextTabs = [...currentWorkspace.tabs];
    const [draggedTab] = nextTabs.splice(draggedTabIndex, 1);

    if (!draggedTab) {
        return currentWorkspace;
    }

    nextTabs.splice(targetTabIndex, 0, draggedTab);

    const nextSplitView = currentWorkspace.splitView
        ? {
              ...currentWorkspace.splitView,
              secondaryTabIds: nextTabs
                  .map((tab) => tab.id)
                  .filter((id) =>
                      currentWorkspace.splitView?.secondaryTabIds.includes(id),
                  ),
          }
        : null;

    return {
        ...currentWorkspace,
        splitView: nextSplitView,
        tabs: nextTabs,
    };
}

/**
 * Applies a mutation function to a specific tab in the workspace.
 */
export function updateWorkspaceTab(
    currentWorkspace: WorkspaceSession,
    tabId: string,
    updateTab: (tab: WorkspaceTab) => WorkspaceTab,
): WorkspaceSession {
    let hasUpdatedTab = false;
    const nextTabs = currentWorkspace.tabs.map((tab) => {
        if (tab.id !== tabId) {
            return tab;
        }

        hasUpdatedTab = true;
        return updateTab(tab);
    });

    if (!hasUpdatedTab) {
        return currentWorkspace;
    }

    return {
        ...currentWorkspace,
        tabs: nextTabs,
    };
}

/**
 * Applies a mutation function to the active tab in the workspace.
 */
export function updateActiveWorkspaceTab(
    currentWorkspace: WorkspaceSession,
    updateTab: (tab: WorkspaceTab) => WorkspaceTab,
): WorkspaceSession {
    if (!currentWorkspace.activeTabId) {
        return currentWorkspace;
    }

    return updateWorkspaceTab(
        currentWorkspace,
        currentWorkspace.activeTabId,
        updateTab,
    );
}

/**
 * Merges a workspace snapshot into the current session, preserving unsaved changes.
 *
 * @remarks
 * Preserves tabs with unsaved changes that aren't in the snapshot. Validates split
 * view against available tabs. Picks an appropriate active tab from the result.
 */
export function mergeWorkspaceSession(
    currentWorkspace: WorkspaceSession,
    snapshot: WorkspaceSnapshot,
): WorkspaceSession {
    const currentTabsById = new Map(
        currentWorkspace.tabs.map((tab) => [tab.id, tab] as const),
    );
    const snapshotTabsById = new Map(
        snapshot.tabs.map((tab) => [tab.id, tab] as const),
    );
    const snapshotTabIds = new Set(
        snapshot.metadata.tabs.map((tabState) => tabState.id),
    );
    const refreshedTabs = snapshot.metadata.tabs
        .map((tabState) => {
            const snapshotTab = snapshotTabsById.get(tabState.id);

            if (!snapshotTab) {
                return null;
            }

            const currentTab = currentTabsById.get(tabState.id);

            if (currentTab && currentTab.content !== currentTab.savedContent) {
                return {
                    ...currentTab,
                    cursor: clampCursorToContent(
                        currentTab.content,
                        currentTab.cursor,
                    ),
                    fileName: snapshotTab.fileName,
                };
            }

            return {
                ...createWorkspaceTab(snapshotTab),
                cursor: clampCursorToContent(
                    snapshotTab.content,
                    tabState.cursor,
                ),
            };
        })
        .filter((tab): tab is WorkspaceTab => tab !== null);
    const preservedDirtyTabs = currentWorkspace.tabs
        .filter(
            (tab) =>
                !snapshotTabIds.has(tab.id) && tab.content !== tab.savedContent,
        )
        .map((tab) => ({
            ...tab,
            cursor: clampCursorToContent(tab.content, tab.cursor),
        }));
    const nextTabs = [...refreshedTabs, ...preservedDirtyTabs];
    const nextTabIds = new Set(nextTabs.map((tab) => tab.id));

    const normalizedSplitView = normalizeSplitView(
        currentWorkspace.splitView,
        nextTabIds,
    );

    const nextActiveTabId = normalizedSplitView
        ? normalizedSplitView.focusedPane === "primary"
            ? normalizedSplitView.primaryTabId
            : normalizedSplitView.secondaryTabId
        : nextTabs.some((tab) => tab.id === snapshot.metadata.activeTabId)
          ? snapshot.metadata.activeTabId
          : nextTabs.some((tab) => tab.id === currentWorkspace.activeTabId)
            ? currentWorkspace.activeTabId
            : (nextTabs[0]?.id ?? null);

    return {
        workspacePath: snapshot.workspacePath,
        workspaceName: snapshot.workspaceName,
        activeTabId: nextActiveTabId,
        splitView: normalizedSplitView,
        tabs: nextTabs,
        archivedTabs: snapshot.metadata.archivedTabs,
        executionHistory: snapshot.metadata.executionHistory,
    };
}
