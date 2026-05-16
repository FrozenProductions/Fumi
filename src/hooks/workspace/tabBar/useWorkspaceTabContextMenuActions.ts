import type { WorkspaceTabContextMenuState } from "../../../components/workspace/tabBar/workspaceTabBar.type";
import type { WorkspaceScreenSession } from "../../../lib/workspace/session/session.type";
import { getWorkspaceSplitScopeTabIds } from "../../../lib/workspace/session/sessionSplitView";
import type {
    WorkspaceSplitPlacement,
    WorkspaceSplitView,
} from "../../../lib/workspace/session/sessionSplitView.type";
import type { UseWorkspaceTabRenameResult } from "./useWorkspaceTabRename.type";

type UseWorkspaceTabContextMenuActionsOptions = {
    contextMenuState: WorkspaceTabContextMenuState | null;
    isSplitViewArchiveScopeEnabled: boolean;
    splitView: WorkspaceSplitView | null;
    workspace: WorkspaceScreenSession;
    onArchiveAllTabs: (scopeTabIds?: readonly string[]) => void;
    onArchiveOtherTabs: (
        tabId: string,
        scopeTabIds?: readonly string[],
    ) => void;
    onArchiveTab: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    onDuplicateTab: (tabId: string) => void;
    onSplitTab: (
        tabId: string,
        targetPaneId: string | null,
        placement: WorkspaceSplitPlacement,
    ) => void;
    onToggleTabPinned: (tabId: string) => void;
    onStartRename: UseWorkspaceTabRenameResult["handleStartRename"];
};

type UseWorkspaceTabContextMenuActionsResult = {
    canArchiveOtherTabs: boolean;
    onArchive: () => void;
    onArchiveAll: () => void;
    onArchiveOther: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onRename: () => void;
    onSplitBottom: () => void;
    onSplitLeft: () => void;
    onSplitRight: () => void;
    onSplitTop: () => void;
    onTogglePinned: () => void;
};

function getContextMenuArchiveScopeTabIds({
    contextMenuState,
    isSplitViewArchiveScopeEnabled,
    splitView,
    workspace,
}: Pick<
    UseWorkspaceTabContextMenuActionsOptions,
    | "contextMenuState"
    | "isSplitViewArchiveScopeEnabled"
    | "splitView"
    | "workspace"
>): string[] | undefined {
    if (!isSplitViewArchiveScopeEnabled || !contextMenuState || !splitView) {
        return undefined;
    }

    return getWorkspaceSplitScopeTabIds(
        splitView,
        workspace.tabs,
        contextMenuState.tabId,
    );
}

function getCanArchiveOtherTabs(
    workspace: WorkspaceScreenSession,
    scopeTabIds: readonly string[] | undefined,
): boolean {
    let unpinnedTabCount = 0;

    if (!scopeTabIds) {
        for (const tab of workspace.tabs) {
            if (!tab.isPinned) {
                unpinnedTabCount += 1;
            }
        }

        return unpinnedTabCount > 1;
    }

    const tabsById = new Map(workspace.tabs.map((tab) => [tab.id, tab]));

    for (const tabId of scopeTabIds) {
        const tab = tabsById.get(tabId);

        if (tab && !tab.isPinned) {
            unpinnedTabCount += 1;
        }
    }

    return unpinnedTabCount > 1;
}

/**
 * Creates action handlers for the workspace tab context menu.
 *
 * Provides handlers for archive (single, other, all), delete, duplicate, split,
 * pin/unpin, and rename operations. Determines archive scope based on split view
 * settings and validates action availability (e.g., can't close last unpinned tab).
 *
 * @param options - Configuration for context menu actions
 * @param options.contextMenuState - Current context menu state
 * @param options.isSplitViewArchiveScopeEnabled - Whether archive scope is split pane
 * @param options.splitView - Current split view state
 * @param options.workspace - Current workspace session
 * @param options.onArchiveAllTabs - Called to archive all tabs
 * @param options.onArchiveOtherTabs - Called to archive other tabs
 * @param options.onArchiveTab - Called to archive a single tab
 * @param options.onDeleteTab - Called to delete a tab
 * @param options.onDuplicateTab - Called to duplicate a tab
 * @param options.onSplitTab - Called to split a tab
 * @param options.onToggleTabPinned - Called to toggle pin state
 * @param options.onStartRename - Called to start renaming
 * @returns Action handlers for the context menu
 */
export function useWorkspaceTabContextMenuActions({
    contextMenuState,
    isSplitViewArchiveScopeEnabled,
    splitView,
    workspace,
    onArchiveAllTabs,
    onArchiveOtherTabs,
    onArchiveTab,
    onDeleteTab,
    onDuplicateTab,
    onSplitTab,
    onToggleTabPinned,
    onStartRename,
}: UseWorkspaceTabContextMenuActionsOptions): UseWorkspaceTabContextMenuActionsResult {
    const archiveScopeTabIds = getContextMenuArchiveScopeTabIds({
        contextMenuState,
        isSplitViewArchiveScopeEnabled,
        splitView,
        workspace,
    });

    function withContextMenuTabId(action: (tabId: string) => void): void {
        if (!contextMenuState) {
            return;
        }

        action(contextMenuState.tabId);
    }

    const handleRename = (): void => {
        if (!contextMenuState) {
            return;
        }

        const targetTab = workspace.tabs.find(
            (tab) => tab.id === contextMenuState.tabId,
        );

        if (!targetTab) {
            return;
        }

        onStartRename(targetTab.id, targetTab.fileName);
    };

    const handleArchiveAll = (): void => {
        onArchiveAllTabs(archiveScopeTabIds);
    };

    const handleArchiveOther = (): void => {
        if (!contextMenuState) {
            return;
        }

        onArchiveOtherTabs(contextMenuState.tabId, archiveScopeTabIds);
    };

    const handleSplit = (placement: WorkspaceSplitPlacement): void => {
        withContextMenuTabId((tabId) => onSplitTab(tabId, null, placement));
    };

    return {
        canArchiveOtherTabs: getCanArchiveOtherTabs(
            workspace,
            archiveScopeTabIds,
        ),
        onArchive: () => withContextMenuTabId(onArchiveTab),
        onArchiveAll: handleArchiveAll,
        onArchiveOther: handleArchiveOther,
        onDelete: () => withContextMenuTabId(onDeleteTab),
        onDuplicate: () => withContextMenuTabId(onDuplicateTab),
        onRename: handleRename,
        onSplitBottom: () => handleSplit("bottom"),
        onSplitLeft: () => handleSplit("left"),
        onSplitRight: () => handleSplit("right"),
        onSplitTop: () => handleSplit("top"),
        onTogglePinned: () => withContextMenuTabId(onToggleTabPinned),
    };
}
