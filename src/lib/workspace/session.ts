import { DEFAULT_WORKSPACE_SPLIT_RATIO } from "../../constants/workspace/workspace";
import type {
    WorkspaceCursorState,
    WorkspacePaneId,
    WorkspaceSession,
    WorkspaceSnapshot,
    WorkspaceSplitView,
    WorkspaceTab,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../../lib/workspace/workspace.type";
import { clamp } from "../shared/math";
import { normalizeWorkspaceSplitRatio } from "./splitView";

/**
 * Clamps a cursor position to valid coordinates within the given content.
 *
 * @remarks
 * Ensures line and column are within bounds and scrollTop is non-negative.
 */
export function clampCursorToContent(
    content: string,
    cursor: WorkspaceCursorState,
): WorkspaceCursorState {
    const { line: clampedLine, lineLength } = getClampedCursorLine(
        content,
        cursor,
    );

    return {
        line: clampedLine,
        column: clamp(cursor.column, 0, lineLength),
        scrollTop: Math.max(cursor.scrollTop, 0),
    };
}

function getClampedCursorLine(
    content: string,
    cursor: WorkspaceCursorState,
): {
    line: number;
    lineLength: number;
} {
    const requestedLine = Math.max(cursor.line, 0);
    let currentLine = 0;
    let currentLineStart = 0;
    let requestedLineLength: number | null = null;

    for (let index = 0; index < content.length; index += 1) {
        if (content.charCodeAt(index) !== 10) {
            continue;
        }

        if (currentLine === requestedLine) {
            requestedLineLength = index - currentLineStart;
        }

        currentLine += 1;
        currentLineStart = index + 1;
    }

    const finalLineLength = content.length - currentLineStart;

    if (currentLine === requestedLine) {
        requestedLineLength = finalLineLength;
    }

    return {
        line: Math.min(requestedLine, currentLine),
        lineLength: requestedLineLength ?? finalLineLength,
    };
}

function createWorkspaceTab(tab: WorkspaceTabSnapshot): WorkspaceTab {
    return {
        ...tab,
        savedContent: tab.content,
        contentRevision: 0,
    };
}

/**
 * Normalizes a split view configuration by filtering to valid open tabs.
 *
 * @remarks
 * Returns null if primary/secondary tab IDs are invalid or the same.
 * Also normalizes the split ratio to valid bounds.
 */
export function normalizeSplitView(
    splitView: WorkspaceSplitView | null,
    openTabIds: Set<string>,
): WorkspaceSplitView | null {
    if (!splitView) {
        return null;
    }

    const primaryValid = openTabIds.has(splitView.primaryTabId);
    const secondaryValid = openTabIds.has(splitView.secondaryTabId);
    const notSame = splitView.primaryTabId !== splitView.secondaryTabId;

    if (!primaryValid || !secondaryValid || !notSame) {
        return null;
    }

    const validSecondaryTabIds = (
        splitView.secondaryTabIds ?? [splitView.secondaryTabId]
    ).filter((id) => openTabIds.has(id) && id !== splitView.primaryTabId);

    const normalizedSecondaryTabIds = validSecondaryTabIds.includes(
        splitView.secondaryTabId,
    )
        ? validSecondaryTabIds
        : [splitView.secondaryTabId, ...validSecondaryTabIds];

    return {
        ...splitView,
        secondaryTabIds: normalizedSecondaryTabIds,
        splitRatio: normalizeWorkspaceSplitRatio(splitView.splitRatio),
    };
}

/**
 * Determines which pane's tab should be active based on split view and active tab.
 */
export function getFocusedPaneTabId(
    splitView: WorkspaceSplitView | null,
    activeTabId: string | null,
): string | null {
    if (!splitView) {
        return activeTabId;
    }

    return splitView.focusedPane === "primary"
        ? splitView.primaryTabId
        : splitView.secondaryTabId;
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
 * Removes a tab from the split view configuration.
 *
 * @remarks
 * Returns null if the primary tab is removed. Updates secondary tab IDs
 * and picks a new secondary tab ID if needed.
 */
export function removedTabFromSplitView(
    splitView: WorkspaceSplitView,
    removedTabId: string,
): WorkspaceSplitView | null {
    if (splitView.primaryTabId === removedTabId) {
        return null;
    }

    if (splitView.secondaryTabIds.includes(removedTabId)) {
        const nextSecondaryTabIds = splitView.secondaryTabIds.filter(
            (id) => id !== removedTabId,
        );

        if (nextSecondaryTabIds.length === 0) {
            return null;
        }

        const nextSecondaryTabId =
            splitView.secondaryTabId === removedTabId
                ? (nextSecondaryTabIds[0] ?? splitView.secondaryTabId)
                : splitView.secondaryTabId;

        return {
            ...splitView,
            secondaryTabId: nextSecondaryTabId,
            secondaryTabIds: nextSecondaryTabIds,
        };
    }

    return splitView;
}

function getPrimaryPaneTabId(
    workspace: WorkspaceSession,
    secondaryTabIds: string[],
    fallbackTabId: string | null,
): string | null {
    const secondaryTabIdSet = new Set(secondaryTabIds);

    if (
        fallbackTabId &&
        !secondaryTabIdSet.has(fallbackTabId) &&
        workspace.tabs.some((tab) => tab.id === fallbackTabId)
    ) {
        return fallbackTabId;
    }

    return (
        workspace.tabs.find((tab) => !secondaryTabIdSet.has(tab.id))?.id ?? null
    );
}

/**
 * Updates workspace state to select a specific tab.
 *
 * @remarks
 * Updates activeTabId and adjusts split view to show the selected tab in the
 * appropriate pane. Removes tabs that become invalid from secondary positions.
 */
export function selectWorkspaceTabState(
    currentWorkspace: WorkspaceSession,
    tabId: string,
): WorkspaceSession {
    if (!currentWorkspace.tabs.some((tab) => tab.id === tabId)) {
        return currentWorkspace;
    }

    const splitView = currentWorkspace.splitView;
    let nextSplitView = splitView;

    if (splitView) {
        const isInSecondary = splitView.secondaryTabIds.includes(tabId);
        const isInPrimary = !isInSecondary;

        if (isInSecondary && splitView.focusedPane === "secondary") {
            nextSplitView = {
                ...splitView,
                secondaryTabId: tabId,
            };
        } else if (isInSecondary && splitView.focusedPane === "primary") {
            nextSplitView = {
                ...splitView,
                secondaryTabId: tabId,
                focusedPane: "secondary",
            };
        } else if (isInPrimary && splitView.focusedPane === "primary") {
            nextSplitView = {
                ...splitView,
                primaryTabId: tabId,
            };
        } else {
            nextSplitView = {
                ...splitView,
                primaryTabId: tabId,
                focusedPane: "primary",
            };
        }

        const nextPrimary =
            nextSplitView?.primaryTabId ?? splitView.primaryTabId;
        if (nextSplitView?.secondaryTabIds.includes(nextPrimary)) {
            const filteredSecondary = nextSplitView.secondaryTabIds.filter(
                (id) => id !== nextPrimary,
            );
            if (filteredSecondary.length === 0) {
                nextSplitView = null;
            } else {
                nextSplitView = {
                    ...nextSplitView,
                    secondaryTabIds: filteredSecondary,
                    secondaryTabId: filteredSecondary.includes(
                        nextSplitView.secondaryTabId,
                    )
                        ? nextSplitView.secondaryTabId
                        : (filteredSecondary[0] ??
                          nextSplitView.secondaryTabId),
                };
            }
        }
    }

    if (
        currentWorkspace.activeTabId === tabId &&
        currentWorkspace.splitView === nextSplitView
    ) {
        return currentWorkspace;
    }

    return {
        ...currentWorkspace,
        activeTabId: tabId,
        splitView: nextSplitView,
    };
}

/**
 * Opens a workspace tab in the specified pane, creating a split view if needed.
 *
 * @remarks
 * If no split view exists, creates one with the current active tab and the target tab.
 * If a split view exists, moves the tab to the specified pane and updates secondary tabs.
 */
export function openWorkspaceTabInPaneState(
    currentWorkspace: WorkspaceSession,
    tabId: string,
    pane: WorkspacePaneId,
): WorkspaceSession {
    if (!currentWorkspace.tabs.some((tab) => tab.id === tabId)) {
        return currentWorkspace;
    }

    const existingSplit = currentWorkspace.splitView;

    if (existingSplit) {
        if (pane === "secondary") {
            let nextSecondaryTabIds = existingSplit.secondaryTabIds.includes(
                tabId,
            )
                ? existingSplit.secondaryTabIds
                : [...existingSplit.secondaryTabIds, tabId];
            let nextPrimaryTabId = getPrimaryPaneTabId(
                currentWorkspace,
                nextSecondaryTabIds,
                existingSplit.primaryTabId === tabId
                    ? null
                    : existingSplit.primaryTabId,
            );

            if (!nextPrimaryTabId) {
                nextPrimaryTabId =
                    existingSplit.secondaryTabId === tabId
                        ? (existingSplit.secondaryTabIds.find(
                              (id) => id !== tabId,
                          ) ?? null)
                        : existingSplit.secondaryTabId;
            }

            if (!nextPrimaryTabId) {
                return {
                    ...currentWorkspace,
                    activeTabId: tabId,
                    splitView: null,
                };
            }

            nextSecondaryTabIds = nextSecondaryTabIds.filter(
                (id) => id !== nextPrimaryTabId,
            );

            return {
                ...currentWorkspace,
                activeTabId: tabId,
                splitView: {
                    ...existingSplit,
                    primaryTabId: nextPrimaryTabId,
                    secondaryTabId: tabId,
                    secondaryTabIds: nextSecondaryTabIds,
                    splitRatio: existingSplit.splitRatio,
                    focusedPane: pane,
                },
            };
        }

        const nextSecondaryTabIds = existingSplit.secondaryTabIds.filter(
            (id) => id !== tabId,
        );

        const resolvedSecondaryTabIds =
            nextSecondaryTabIds.length > 0
                ? nextSecondaryTabIds
                : existingSplit.primaryTabId !== tabId
                  ? [existingSplit.primaryTabId]
                  : [];

        if (resolvedSecondaryTabIds.length === 0) {
            return {
                ...currentWorkspace,
                activeTabId: tabId,
                splitView: null,
            };
        }

        return {
            ...currentWorkspace,
            activeTabId: tabId,
            splitView: {
                ...existingSplit,
                primaryTabId: tabId,
                secondaryTabId: resolvedSecondaryTabIds.includes(
                    existingSplit.secondaryTabId,
                )
                    ? existingSplit.secondaryTabId
                    : (resolvedSecondaryTabIds[0] ??
                      existingSplit.secondaryTabId),
                secondaryTabIds: resolvedSecondaryTabIds,
                splitRatio: existingSplit.splitRatio,
                focusedPane: pane,
            },
        };
    }

    const currentActiveTabId = currentWorkspace.activeTabId;

    if (!currentActiveTabId) {
        return {
            ...currentWorkspace,
            activeTabId: tabId,
        };
    }

    if (currentActiveTabId === tabId) {
        const otherTabs = currentWorkspace.tabs.filter(
            (tab) => tab.id !== tabId,
        );

        if (otherTabs.length === 0) {
            return currentWorkspace;
        }

        return {
            ...currentWorkspace,
            activeTabId: tabId,
            splitView:
                pane === "primary"
                    ? {
                          direction: "vertical",
                          primaryTabId: tabId,
                          secondaryTabId: otherTabs[0]?.id ?? tabId,
                          secondaryTabIds: otherTabs.map((tab) => tab.id),
                          splitRatio: normalizeWorkspaceSplitRatio(
                              DEFAULT_WORKSPACE_SPLIT_RATIO,
                          ),
                          focusedPane: pane,
                      }
                    : {
                          direction: "vertical",
                          primaryTabId: otherTabs[0]?.id ?? tabId,
                          secondaryTabId: tabId,
                          secondaryTabIds: [tabId],
                          splitRatio: normalizeWorkspaceSplitRatio(
                              DEFAULT_WORKSPACE_SPLIT_RATIO,
                          ),
                          focusedPane: pane,
                      },
        };
    }

    return {
        ...currentWorkspace,
        activeTabId: tabId,
        splitView:
            pane === "primary"
                ? {
                      direction: "vertical",
                      primaryTabId: tabId,
                      secondaryTabId: currentActiveTabId,
                      secondaryTabIds: currentWorkspace.tabs
                          .filter((tab) => tab.id !== tabId)
                          .map((tab) => tab.id),
                      splitRatio: normalizeWorkspaceSplitRatio(
                          DEFAULT_WORKSPACE_SPLIT_RATIO,
                      ),
                      focusedPane: pane,
                  }
                : {
                      direction: "vertical",
                      primaryTabId: currentActiveTabId,
                      secondaryTabId: tabId,
                      secondaryTabIds: [tabId],
                      splitRatio: normalizeWorkspaceSplitRatio(
                          DEFAULT_WORKSPACE_SPLIT_RATIO,
                      ),
                      focusedPane: pane,
                  },
    };
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
