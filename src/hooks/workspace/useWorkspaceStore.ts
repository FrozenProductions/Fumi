import { create } from "zustand";
import { readRecentWorkspacePaths } from "../../lib/workspace/persistence";
import { createWorkspaceEditorSlice } from "./store/createWorkspaceEditorSlice";
import { createWorkspaceLifecycleSlice } from "./store/createWorkspaceLifecycleSlice";
import { createWorkspaceTabSlice } from "./store/createWorkspaceTabSlice";
import { createWorkspaceExitGuardSync } from "./store/syncExitGuard";
import type { WorkspaceStore } from "./store/workspaceStore.type";

export {
    selectWorkspaceActiveTab,
    selectWorkspaceActiveTabIndex,
    selectWorkspaceHasUnsavedChanges,
    selectWorkspacePath,
    selectWorkspacePersistSignature,
    selectWorkspaceShouldGuardExit,
} from "./store/selectors";

export const useWorkspaceStore = create<WorkspaceStore>((set, get, store) => {
    const workspaceStore: WorkspaceStore = {
        workspace: null,
        recentWorkspacePaths: readRecentWorkspacePaths(),
        isBootstrapping: true,
        isHydrated: false,
        errorMessage: null,
        ...createWorkspaceLifecycleSlice(set, get, store),
        ...createWorkspaceTabSlice(set, get, store),
        ...createWorkspaceEditorSlice(set, get, store),
    };

    return workspaceStore;
});

useWorkspaceStore.subscribe(createWorkspaceExitGuardSync());
