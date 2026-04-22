import { pickDirectory } from "../../platform/dialog";
import { getErrorMessage } from "../../shared/errorMessage";
import { shouldProceedWithWorkspaceSwitch } from "./helpers";
import {
    openResolvedWorkspacePath,
    persistCurrentWorkspaceBeforeSwitch,
} from "./workspaceLifecycleSupport";
import type {
    WorkspaceStoreGet,
    WorkspaceStoreSet,
} from "./workspaceStore.type";

export function createOpenWorkspaceDirectoryAction(
    set: WorkspaceStoreSet,
    get: WorkspaceStoreGet,
): () => Promise<void> {
    return async (): Promise<void> => {
        const { workspace } = get();

        try {
            const shouldSwitchWorkspace =
                await shouldProceedWithWorkspaceSwitch(workspace);

            if (!shouldSwitchWorkspace) {
                return;
            }

            const pickedWorkspacePath = await pickDirectory(
                workspace?.workspacePath ?? undefined,
            );

            if (!pickedWorkspacePath) {
                return;
            }

            if (workspace?.workspacePath === pickedWorkspacePath) {
                set({ errorMessage: null });
                return;
            }

            const didPersistCurrentWorkspace =
                await persistCurrentWorkspaceBeforeSwitch(get);

            if (!didPersistCurrentWorkspace) {
                return;
            }

            await openResolvedWorkspacePath(set, get, pickedWorkspacePath);
        } catch (error) {
            console.error("Failed to open workspace.", error);
            set({
                errorMessage: getErrorMessage(
                    error,
                    "Could not open the selected workspace.",
                ),
            });
        }
    };
}

export function createOpenWorkspacePathAction(
    set: WorkspaceStoreSet,
    get: WorkspaceStoreGet,
): (workspacePath: string) => Promise<void> {
    return async (workspacePath: string): Promise<void> => {
        const { workspace } = get();
        const trimmedWorkspacePath = workspacePath.trim();

        if (!trimmedWorkspacePath) {
            return;
        }

        try {
            const shouldSwitchWorkspace =
                await shouldProceedWithWorkspaceSwitch(workspace);

            if (!shouldSwitchWorkspace) {
                return;
            }

            if (workspace?.workspacePath === trimmedWorkspacePath) {
                set({ errorMessage: null });
                return;
            }

            const didPersistCurrentWorkspace =
                await persistCurrentWorkspaceBeforeSwitch(get);

            if (!didPersistCurrentWorkspace) {
                return;
            }

            await openResolvedWorkspacePath(set, get, trimmedWorkspacePath);
        } catch (error) {
            console.error("Failed to open workspace.", error);
            set({
                errorMessage: getErrorMessage(
                    error,
                    "Could not open the selected workspace.",
                ),
            });
        }
    };
}
