import type {
    WorkspaceCursorState,
    WorkspaceSession,
    WorkspaceSnapshot,
    WorkspaceTab,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../../lib/workspace/workspace.type";
import { clamp } from "../shared/math";

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

    const activeTabId = tabs.some(
        (tab) => tab.id === snapshot.metadata.activeTabId,
    )
        ? snapshot.metadata.activeTabId
        : (tabs[0]?.id ?? null);

    return {
        workspacePath: snapshot.workspacePath,
        workspaceName: snapshot.workspaceName,
        activeTabId,
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

    return {
        ...currentWorkspace,
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

    const nextActiveTabId = nextTabs.some(
        (tab) => tab.id === snapshot.metadata.activeTabId,
    )
        ? snapshot.metadata.activeTabId
        : nextTabs.some((tab) => tab.id === currentWorkspace.activeTabId)
          ? currentWorkspace.activeTabId
          : (nextTabs[0]?.id ?? null);

    return {
        workspacePath: snapshot.workspacePath,
        workspaceName: snapshot.workspaceName,
        activeTabId: nextActiveTabId,
        tabs: nextTabs,
        archivedTabs: snapshot.metadata.archivedTabs,
    };
}
