import type { WorkspaceStore } from "./workspaceStore.type";

export type WorkspaceExitGuardSync = (state: WorkspaceStore) => void;
