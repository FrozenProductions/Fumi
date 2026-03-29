import type { UseWorkspaceSessionResult } from "../../types/workspace/session";
import {
    selectWorkspaceActiveTab,
    selectWorkspaceActiveTabIndex,
    selectWorkspaceHasUnsavedChanges,
    useWorkspaceStore,
} from "./useWorkspaceStore";

export function useWorkspaceSession(): UseWorkspaceSessionResult {
    const isBootstrapping = useWorkspaceStore((state) => state.isBootstrapping);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const recentWorkspacePaths = useWorkspaceStore(
        (state) => state.recentWorkspacePaths,
    );
    const errorMessage = useWorkspaceStore((state) => state.errorMessage);
    const openWorkspaceDirectory = useWorkspaceStore(
        (state) => state.openWorkspaceDirectory,
    );
    const openWorkspacePath = useWorkspaceStore(
        (state) => state.openWorkspacePath,
    );
    const createWorkspaceFile = useWorkspaceStore(
        (state) => state.createWorkspaceFile,
    );
    const addWorkspaceScriptTab = useWorkspaceStore(
        (state) => state.addWorkspaceScriptTab,
    );
    const archiveWorkspaceTab = useWorkspaceStore(
        (state) => state.archiveWorkspaceTab,
    );
    const restoreArchivedWorkspaceTab = useWorkspaceStore(
        (state) => state.restoreArchivedWorkspaceTab,
    );
    const deleteArchivedWorkspaceTab = useWorkspaceStore(
        (state) => state.deleteArchivedWorkspaceTab,
    );
    const renameWorkspaceTab = useWorkspaceStore(
        (state) => state.renameWorkspaceTab,
    );
    const selectWorkspaceTab = useWorkspaceStore(
        (state) => state.selectWorkspaceTab,
    );
    const saveActiveWorkspaceTab = useWorkspaceStore(
        (state) => state.saveActiveWorkspaceTab,
    );
    const updateActiveTabContent = useWorkspaceStore(
        (state) => state.updateActiveTabContent,
    );
    const updateActiveTabCursor = useWorkspaceStore(
        (state) => state.updateActiveTabCursor,
    );
    const updateActiveTabScrollTop = useWorkspaceStore(
        (state) => state.updateActiveTabScrollTop,
    );
    const activeTab = useWorkspaceStore(selectWorkspaceActiveTab);
    const activeTabIndex = useWorkspaceStore(selectWorkspaceActiveTabIndex);
    const hasUnsavedChanges = useWorkspaceStore(
        selectWorkspaceHasUnsavedChanges,
    );

    return {
        isBootstrapping,
        workspace,
        activeTab,
        activeTabIndex,
        recentWorkspacePaths,
        errorMessage,
        hasUnsavedChanges,
        openWorkspaceDirectory,
        openWorkspacePath,
        createWorkspaceFile,
        addWorkspaceScriptTab,
        archiveWorkspaceTab,
        restoreArchivedWorkspaceTab,
        deleteArchivedWorkspaceTab,
        renameWorkspaceTab,
        selectWorkspaceTab,
        saveActiveWorkspaceTab,
        updateActiveTabContent,
        updateActiveTabCursor,
        updateActiveTabScrollTop,
    };
}
