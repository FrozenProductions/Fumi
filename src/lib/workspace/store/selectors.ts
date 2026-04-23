import { getActiveTabIndex } from "../session/session";
import type {
    WorkspaceExecutionHistoryEntry,
    WorkspacePaneId,
    WorkspaceScreenSession,
    WorkspaceScreenTab,
    WorkspaceSplitView,
    WorkspaceTab,
    WorkspaceTabState,
} from "../workspace.type";
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
            tab.isDirty === (nextTab.content !== nextTab.savedContent)
        );
    });
}

function createWorkspaceScreenTab(tab: WorkspaceTab): WorkspaceScreenTab {
    return {
        id: tab.id,
        fileName: tab.fileName,
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

    if (
        currentSplitView.direction !== nextSplitView.direction ||
        currentSplitView.primaryTabId !== nextSplitView.primaryTabId ||
        currentSplitView.secondaryTabId !== nextSplitView.secondaryTabId ||
        currentSplitView.splitRatio !== nextSplitView.splitRatio ||
        currentSplitView.focusedPane !== nextSplitView.focusedPane ||
        currentSplitView.secondaryTabIds.length !==
            nextSplitView.secondaryTabIds.length
    ) {
        return false;
    }

    return currentSplitView.secondaryTabIds.every((tabId, index) => {
        return tabId === nextSplitView.secondaryTabIds[index];
    });
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

export const selectWorkspaceActiveTab = (
    state: WorkspaceStore,
): WorkspaceTab | null => getActiveTabFromWorkspace(state.workspace);

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

export const selectWorkspaceHasUnsavedChanges = (
    state: WorkspaceStore,
): boolean => state.dirtyTabCount > 0;

/**
 * Returns whether the workspace has unsaved changes and should guard against window close.
 */
export const selectWorkspaceShouldGuardExit = (
    state: WorkspaceStore,
): boolean => selectWorkspaceHasUnsavedChanges(state);

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

export const selectWorkspaceSplitView = (
    state: WorkspaceStore,
): WorkspaceSplitView | null => state.workspace?.splitView ?? null;

export const selectWorkspaceSplitFocusedPane = (
    state: WorkspaceStore,
): WorkspacePaneId | null => state.workspace?.splitView?.focusedPane ?? null;
