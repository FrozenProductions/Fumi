import { useEffect, useEffectEvent } from "react";
import { subscribeToDroppedFiles } from "../../lib/platform/window";
import { useAppStore } from "../app/useAppStore";
import { useWorkspaceStore } from "./useWorkspaceStore";

/**
 * Subscribes to dropped files events and imports workspace files on drop.
 *
 * @remarks
 * When files are dropped on the window, this hook imports them via the workspace
 * store and switches to the workspace screen if any files were successfully imported.
 */
export function useWorkspaceDroppedFiles(): void {
    const selectSidebarItem = useAppStore((state) => state.selectSidebarItem);
    const importDroppedWorkspaceFiles = useWorkspaceStore(
        (state) => state.importDroppedWorkspaceFiles,
    );
    const handleDroppedFiles = useEffectEvent(
        async (filePaths: readonly string[]): Promise<void> => {
            const didImport = await importDroppedWorkspaceFiles([...filePaths]);

            if (didImport) {
                selectSidebarItem("workspace");
            }
        },
    );

    useEffect(() => {
        return subscribeToDroppedFiles((filePaths) => {
            void handleDroppedFiles(filePaths);
        });
    }, []);
}
