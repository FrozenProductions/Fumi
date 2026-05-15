import type { WorkspaceExecutionHistoryEntry } from "../executionHistory/executionHistory.type";
import type { WorkspaceScreenSession } from "../session/session.type";
import type {
    WorkspaceSplitNode,
    WorkspaceSplitView,
} from "../session/sessionSplitView.type";
import { getActiveTabIndex } from "../session/tabs/sessionTabs";
import type {
    WorkspaceScreenTab,
    WorkspaceTab,
    WorkspaceTabState,
} from "../session/tabs/sessionTabs.type";
import { getActiveTabFromWorkspace } from "./workspaceNavigation";
import type { WorkspaceStore } from "./workspaceStore.type";

let previousWorkspaceScreenSession: WorkspaceScreenSession | null = null;

function areWorkspaceScreenTabsEqual(
    currentTabs: readonly WorkspaceScreenTab[],
    nextTabs: readonly WorkspaceTab[],
): boolean {
    if (currentTabs.length !== nextTabs.length) {
        return false;
    }

    return currentTabs.every((tab, index) => {
        const nextTab = nextTabs[index];

        if (!nextTab) {
            return false;
        }

        return (
            tab.id === nextTab.id &&
            tab.fileName === nextTab.fileName &&
            tab.isPinned === (nextTab.isPinned === true) &&
            tab.isDirty === (nextTab.content !== nextTab.savedContent)
        );
    });
}

function createWorkspaceScreenTab(tab: WorkspaceTab): WorkspaceScreenTab {
    return {
        id: tab.id,
        fileName: tab.fileName,
        isPinned: tab.isPinned === true,
        isDirty: tab.content !== tab.savedContent,
    };
}

function areWorkspaceTabStatesEqual(
    currentTabs: readonly WorkspaceTabState[],
    nextTabs: readonly WorkspaceTabState[],
): boolean {
    if (currentTabs.length !== nextTabs.length) {
        return false;
    }

    return currentTabs.every((tab, index) => {
        const nextTab = nextTabs[index];

        if (!nextTab) {
            return false;
        }

        return (
            tab.id === nextTab.id &&
            tab.fileName === nextTab.fileName &&
            (tab.isPinned === true) === (nextTab.isPinned === true) &&
            tab.archivedAt === nextTab.archivedAt &&
            tab.cursor.line === nextTab.cursor.line &&
            tab.cursor.column === nextTab.cursor.column &&
            tab.cursor.scrollTop === nextTab.cursor.scrollTop
        );
    });
}

function areWorkspaceExecutionHistoryEntriesEqual(
    currentEntries: readonly WorkspaceExecutionHistoryEntry[],
    nextEntries: readonly WorkspaceExecutionHistoryEntry[],
): boolean {
    if (currentEntries.length !== nextEntries.length) {
        return false;
    }

    return currentEntries.every((entry, index) => {
        const nextEntry = nextEntries[index];

        if (!nextEntry) {
            return false;
        }

        return (
            entry.id === nextEntry.id &&
            entry.executedAt === nextEntry.executedAt &&
            entry.executorKind === nextEntry.executorKind &&
            entry.port === nextEntry.port &&
            entry.accountId === nextEntry.accountId &&
            entry.accountDisplayName === nextEntry.accountDisplayName &&
            entry.isBoundToUnknownAccount ===
                nextEntry.isBoundToUnknownAccount &&
            entry.fileName === nextEntry.fileName &&
            entry.scriptContent === nextEntry.scriptContent
        );
    });
}

function areWorkspaceSplitViewsEqual(
    currentSplitView: WorkspaceSplitView | null,
    nextSplitView: WorkspaceSplitView | null,
): boolean {
    if (currentSplitView === nextSplitView) {
        return true;
    }

    if (!currentSplitView || !nextSplitView) {
        return false;
    }

    if (!currentSplitView.root || !nextSplitView.root) {
        return currentSplitView === nextSplitView;
    }

    return (
        currentSplitView.activePaneId === nextSplitView.activePaneId &&
        areWorkspaceSplitNodesEqual(currentSplitView.root, nextSplitView.root)
    );
}

function areWorkspaceSplitNodesEqual(
    currentNode: WorkspaceSplitNode,
    nextNode: WorkspaceSplitNode,
): boolean {
    if (currentNode.type !== nextNode.type || currentNode.id !== nextNode.id) {
        return false;
    }

    if (currentNode.type === "pane" && nextNode.type === "pane") {
        return (
            currentNode.activeTabId === nextNode.activeTabId &&
            currentNode.tabIds.length === nextNode.tabIds.length &&
            currentNode.tabIds.every(
                (tabId, index) => tabId === nextNode.tabIds[index],
            )
        );
    }

    if (currentNode.type === "split" && nextNode.type === "split") {
        return (
            currentNode.direction === nextNode.direction &&
            currentNode.children.length === nextNode.children.length &&
            currentNode.ratios.length === nextNode.ratios.length &&
            currentNode.ratios.every(
                (ratio, index) => ratio === nextNode.ratios[index],
            ) &&
            currentNode.children.every((child, index) => {
                const nextChild = nextNode.children[index];
                return nextChild
                    ? areWorkspaceSplitNodesEqual(child, nextChild)
                    : false;
            })
        );
    }

    return false;
}

/**
 * Memoized selectors for workspace store state.
 *
 * @remarks
 * Provides derived state computations from the workspace store including
 * active tab, unsaved changes, exit guard status, and split view state.
 */
export const selectWorkspaceActiveTabIndex = (state: WorkspaceStore): number =>
    getActiveTabIndex(
        state.workspace?.tabs ?? [],
        state.workspace?.activeTabId ?? null,
    );

/**
 * Returns the currently active workspace tab, or null if no workspace is loaded.
 *
 * @param state - The workspace store state
 */
export const selectWorkspaceActiveTab = (
    state: WorkspaceStore,
): WorkspaceTab | null => getActiveTabFromWorkspace(state.workspace);

/**
 * Derives the lightweight screen session snapshot from workspace state, returning a cached reference when unchanged.
 *
 * Performs shallow equality checks on tabs, split view, archived tabs, and execution history
 * to avoid unnecessary re-renders in screen consumers.
 *
 * @param state - The workspace store state
 * @returns A memoized WorkspaceScreenSession, or null if no workspace is loaded
 */
export const selectWorkspaceScreenSession = (
    state: WorkspaceStore,
): WorkspaceScreenSession | null => {
    const workspace = state.workspace;

    if (!workspace) {
        previousWorkspaceScreenSession = null;
        return null;
    }

    if (
        previousWorkspaceScreenSession &&
        previousWorkspaceScreenSession.workspacePath ===
            workspace.workspacePath &&
        previousWorkspaceScreenSession.workspaceName ===
            workspace.workspaceName &&
        previousWorkspaceScreenSession.activeTabId === workspace.activeTabId &&
        areWorkspaceSplitViewsEqual(
            previousWorkspaceScreenSession.splitView,
            workspace.splitView,
        ) &&
        areWorkspaceTabStatesEqual(
            previousWorkspaceScreenSession.archivedTabs,
            workspace.archivedTabs,
        ) &&
        areWorkspaceExecutionHistoryEntriesEqual(
            previousWorkspaceScreenSession.executionHistory,
            workspace.executionHistory,
        ) &&
        areWorkspaceScreenTabsEqual(
            previousWorkspaceScreenSession.tabs,
            workspace.tabs,
        )
    ) {
        return previousWorkspaceScreenSession;
    }

    previousWorkspaceScreenSession = {
        workspacePath: workspace.workspacePath,
        workspaceName: workspace.workspaceName,
        activeTabId: workspace.activeTabId,
        splitView: workspace.splitView,
        tabs: workspace.tabs.map(createWorkspaceScreenTab),
        archivedTabs: workspace.archivedTabs,
        executionHistory: workspace.executionHistory,
    };

    return previousWorkspaceScreenSession;
};

/**
 * Returns whether any workspace tab has unsaved changes.
 *
 * @param state - The workspace store state
 */
export const selectWorkspaceHasUnsavedChanges = (
    state: WorkspaceStore,
): boolean => state.dirtyTabCount > 0;

/**
 * Returns whether the workspace has unsaved changes and should guard against window close.
 */
export const selectWorkspaceShouldGuardExit = (
    state: WorkspaceStore,
): boolean => selectWorkspaceHasUnsavedChanges(state);

/**
 * Returns the loaded workspace's directory path, or null if no workspace is loaded.
 *
 * @param state - The workspace store state
 */
export const selectWorkspacePath = (state: WorkspaceStore): string | null =>
    state.workspace?.workspacePath ?? null;

/**
 * Returns the current persist revision if there are unpersisted changes, otherwise null.
 *
 * @remarks
 * Used to decide whether to trigger a background persist of workspace state.
 */
export const selectWorkspacePersistRevision = (
    state: WorkspaceStore,
): number | null =>
    state.isHydrated && state.persistRevision !== state.lastPersistedRevision
        ? state.persistRevision
        : null;
