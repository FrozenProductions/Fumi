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

export function clampCursorToContent(
    content: string,
    cursor: WorkspaceCursorState,
): WorkspaceCursorState {
    const contentLines = content.split("\n");
    const maxLine = Math.max(contentLines.length - 1, 0);
    const clampedLine = clamp(cursor.line, 0, maxLine);
    const lineLength = contentLines[clampedLine]?.length ?? 0;

    return {
        line: clampedLine,
        column: clamp(cursor.column, 0, lineLength),
        scrollTop: Math.max(cursor.scrollTop, 0),
    };
}

function createWorkspaceTab(tab: WorkspaceTabSnapshot): WorkspaceTab {
    return {
        ...tab,
        savedContent: tab.content,
    };
}

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
    };
}

export function getActiveTabIndex(
    tabs: WorkspaceTab[],
    activeTabId: string | null,
): number {
    if (!activeTabId) {
        return -1;
    }

    return tabs.findIndex((tab) => tab.id === activeTabId);
}

export function serializeTabState(tab: WorkspaceTab): WorkspaceTabState {
    return {
        id: tab.id,
        fileName: tab.fileName,
        cursor: tab.cursor,
    };
}

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

export function hasWorkspaceDraftChanges(workspace: WorkspaceSession): boolean {
    return workspace.tabs.some((tab) => tab.content !== tab.savedContent);
}

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

export function mergeWorkspaceSession(
    currentWorkspace: WorkspaceSession,
    snapshot: WorkspaceSnapshot,
): WorkspaceSession {
    const currentTabsById = new Map(
        currentWorkspace.tabs.map((tab) => [tab.id, tab] as const),
    );
    const snapshotTabIds = new Set(
        snapshot.metadata.tabs.map((tabState) => tabState.id),
    );
    const refreshedTabs = snapshot.metadata.tabs
        .map((tabState) => {
            const snapshotTab = snapshot.tabs.find(
                (tab) => tab.id === tabState.id,
            );

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
    };
}
