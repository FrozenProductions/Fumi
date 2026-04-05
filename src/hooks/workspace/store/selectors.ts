import { getWorkspacePersistSignature } from "../../../lib/workspace/persistence";
import { getActiveTabIndex } from "../../../lib/workspace/session";
import type { WorkspaceTab } from "../../../lib/workspace/workspace.type";
import { getActiveTabFromWorkspace } from "./helpers";
import type { WorkspaceStore } from "./workspaceStore.type";

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

export const selectWorkspacePersistSignature = (
    state: WorkspaceStore,
): string | null =>
    state.isHydrated ? getWorkspacePersistSignature(state.workspace) : null;
