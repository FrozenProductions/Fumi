import type {
    WorkspaceStoreSliceCreator,
    WorkspaceTabSlice,
} from "../workspaceStore.type";
import { createWorkspaceArchiveSlice } from "./createWorkspaceArchiveSlice";
import { createWorkspaceFileSlice } from "./createWorkspaceFileSlice";
import { createWorkspaceLayoutSlice } from "./createWorkspaceLayoutSlice";

/** Creates the workspace store slice that composes file, archive, and layout tab actions. */
export const createWorkspaceTabSlice: WorkspaceStoreSliceCreator<
    WorkspaceTabSlice
> = (set, get, store) => ({
    ...createWorkspaceFileSlice(set, get, store),
    ...createWorkspaceArchiveSlice(set, get, store),
    ...createWorkspaceLayoutSlice(set, get, store),
});
