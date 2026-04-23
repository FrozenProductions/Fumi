import {
    selectWorkspaceActiveTab,
    selectWorkspaceActiveTabIndex,
    selectWorkspaceHasUnsavedChanges,
} from "../../lib/workspace/store/selectors";
import type { UseWorkspaceSessionResult } from "./useWorkspaceSession.type";
import { useWorkspaceStore } from "./useWorkspaceStore";

/**
 * Provides structured access to workspace store state and grouped actions.
 *
 * @remarks
 * Organizes workspace operations into state, workspace actions, tab actions,
 * archive actions, and editor actions for ergonomic consumption by components.
 */
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
    const importDroppedWorkspaceFiles = useWorkspaceStore(
        (state) => state.importDroppedWorkspaceFiles,
    );
    const duplicateWorkspaceTab = useWorkspaceStore(
        (state) => state.duplicateWorkspaceTab,
    );
    const archiveWorkspaceTab = useWorkspaceStore(
        (state) => state.archiveWorkspaceTab,
    );
    const deleteWorkspaceTab = useWorkspaceStore(
        (state) => state.deleteWorkspaceTab,
    );
    const restoreArchivedWorkspaceTab = useWorkspaceStore(
        (state) => state.restoreArchivedWorkspaceTab,
    );
    const restoreAllArchivedWorkspaceTabs = useWorkspaceStore(
        (state) => state.restoreAllArchivedWorkspaceTabs,
    );
    const deleteArchivedWorkspaceTab = useWorkspaceStore(
        (state) => state.deleteArchivedWorkspaceTab,
    );
    const deleteAllArchivedWorkspaceTabs = useWorkspaceStore(
        (state) => state.deleteAllArchivedWorkspaceTabs,
    );
    const renameWorkspaceTab = useWorkspaceStore(
        (state) => state.renameWorkspaceTab,
    );
    const selectWorkspaceTab = useWorkspaceStore(
        (state) => state.selectWorkspaceTab,
    );
    const reorderWorkspaceTab = useWorkspaceStore(
        (state) => state.reorderWorkspaceTab,
    );
    const openWorkspaceTabInPane = useWorkspaceStore(
        (state) => state.openWorkspaceTabInPane,
    );
    const setWorkspaceSplitRatio = useWorkspaceStore(
        (state) => state.setWorkspaceSplitRatio,
    );
    const resetWorkspaceSplitView = useWorkspaceStore(
        (state) => state.resetWorkspaceSplitView,
    );
    const toggleWorkspaceSplitView = useWorkspaceStore(
        (state) => state.toggleWorkspaceSplitView,
    );
    const focusWorkspacePane = useWorkspaceStore(
        (state) => state.focusWorkspacePane,
    );
    const closeWorkspaceSplitView = useWorkspaceStore(
        (state) => state.closeWorkspaceSplitView,
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
    const clearErrorMessage = useWorkspaceStore(
        (state) => state.clearErrorMessage,
    );
    const activeTab = useWorkspaceStore(selectWorkspaceActiveTab);
    const activeTabIndex = useWorkspaceStore(selectWorkspaceActiveTabIndex);
    const hasUnsavedChanges = useWorkspaceStore(
        selectWorkspaceHasUnsavedChanges,
    );

    return {
        state: {
            isBootstrapping,
            workspace,
            activeTab,
            activeTabIndex,
            recentWorkspacePaths,
            errorMessage,
            hasUnsavedChanges,
        },
        workspaceActions: {
            openWorkspaceDirectory,
            openWorkspacePath,
            createWorkspaceFile,
            addWorkspaceScriptTab,
            importDroppedWorkspaceFiles,
        },
        tabActions: {
            duplicateWorkspaceTab,
            archiveWorkspaceTab,
            deleteWorkspaceTab,
            renameWorkspaceTab,
            selectWorkspaceTab,
            reorderWorkspaceTab,
            saveActiveWorkspaceTab,
            openWorkspaceTabInPane,
            setWorkspaceSplitRatio,
            resetWorkspaceSplitView,
            toggleWorkspaceSplitView,
            focusWorkspacePane,
            closeWorkspaceSplitView,
        },
        archiveActions: {
            restoreArchivedWorkspaceTab,
            restoreAllArchivedWorkspaceTabs,
            deleteArchivedWorkspaceTab,
            deleteAllArchivedWorkspaceTabs,
        },
        editorActions: {
            updateActiveTabContent,
            updateActiveTabCursor,
            updateActiveTabScrollTop,
            clearErrorMessage,
        },
    };
}
