import { DEFAULT_WORKSPACE_SPLIT_RATIO } from "../../../constants/workspace/workspace";
import { normalizeWorkspaceSplitRatio } from "../splitView";
import type {
    WorkspacePaneId,
    WorkspaceSession,
    WorkspaceSplitView,
} from "../workspace.type";

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
