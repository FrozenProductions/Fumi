import { create } from "zustand";
import { readRecentWorkspacePaths } from "../../lib/workspace/persistence";
import { createWorkspaceEditorSlice } from "./store/createWorkspaceEditorSlice";
import { createWorkspaceLifecycleSlice } from "./store/createWorkspaceLifecycleSlice";
import { createWorkspaceTabSlice } from "./store/createWorkspaceTabSlice";
import type { WorkspaceStore } from "./store/workspaceStore.type";

/**
 * Workspace state store combining lifecycle, tab, and editor slices.
 *
 * @remarks
 * Provides unified access to workspace state and actions through composed slices.
 * Reads recent workspace paths from persisted storage on initialization.
 */
export const useWorkspaceStore = create<WorkspaceStore>((set, get, store) => {
    const workspaceStore: WorkspaceStore = {
        workspace: null,
        dirtyTabCount: 0,
        transientTabCursorsById: {},
        recentWorkspacePaths: readRecentWorkspacePaths(),
        persistRevision: 0,
        lastPersistedRevision: 0,
        isBootstrapping: true,
        isHydrated: false,
        errorMessage: null,
        ...createWorkspaceLifecycleSlice(set, get, store),
        ...createWorkspaceTabSlice(set, get, store),
        ...createWorkspaceEditorSlice(set, get, store),
    };

    return workspaceStore;
});
