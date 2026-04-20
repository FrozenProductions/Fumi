import { getActiveTabIndex } from "../../../lib/workspace/session";
import type {
    WorkspacePaneId,
    WorkspaceSplitView,
    WorkspaceTab,
} from "../../../lib/workspace/workspace.type";
import { getActiveTabFromWorkspace } from "./helpers";
import type { WorkspaceStore } from "./workspaceStore.type";

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

export const selectWorkspaceHasUnsavedChanges = (
    state: WorkspaceStore,
): boolean =>
    Boolean(
        state.workspace?.tabs.some((tab) => tab.content !== tab.savedContent),
    );

export const selectWorkspaceShouldGuardExit = (
    state: WorkspaceStore,
): boolean => selectWorkspaceHasUnsavedChanges(state);

export const selectWorkspacePath = (state: WorkspaceStore): string | null =>
    state.workspace?.workspacePath ?? null;

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
