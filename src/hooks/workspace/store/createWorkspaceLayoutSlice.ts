import { DEFAULT_WORKSPACE_SPLIT_RATIO } from "../../../constants/workspace/workspace";
import {
    openWorkspaceTabInPaneState,
    reorderWorkspaceTabs,
    selectWorkspaceTabState,
} from "../../../lib/workspace/session";
import { normalizeWorkspaceSplitRatio } from "../../../lib/workspace/splitView";
import type { WorkspacePaneId } from "../../../lib/workspace/workspace.type";
import { createWorkspaceStoreSupport } from "./createWorkspaceStoreSupport";
import type {
    WorkspaceLayoutSlice,
    WorkspaceStoreSliceCreator,
} from "./workspaceStore.type";

export const createWorkspaceLayoutSlice: WorkspaceStoreSliceCreator<
    WorkspaceLayoutSlice
> = (set, get) => {
    const { updateWorkspaceForPath } = createWorkspaceStoreSupport(set, get);

    return {
        selectWorkspaceTab: (tabId: string): void => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            const nextWorkspace = updateWorkspaceForPath(
                workspace.workspacePath,
                (currentWorkspace) =>
                    selectWorkspaceTabState(currentWorkspace, tabId),
            );

            if (nextWorkspace && nextWorkspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
        reorderWorkspaceTab: (
            draggedTabId: string,
            targetTabId: string,
        ): void => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            const nextWorkspace = updateWorkspaceForPath(
                workspace.workspacePath,
                (currentWorkspace) =>
                    reorderWorkspaceTabs(
                        currentWorkspace,
                        draggedTabId,
                        targetTabId,
                    ),
            );

            if (nextWorkspace && nextWorkspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
        openWorkspaceTabInPane: (
            tabId: string,
            pane: WorkspacePaneId,
        ): void => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            const nextWorkspace = updateWorkspaceForPath(
                workspace.workspacePath,
                (currentWorkspace) =>
                    openWorkspaceTabInPaneState(currentWorkspace, tabId, pane),
            );

            if (nextWorkspace && nextWorkspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
        setWorkspaceSplitRatio: (splitRatio: number): void => {
            set((state) => {
                if (!state.workspace?.splitView) {
                    return {};
                }

                return {
                    workspace: {
                        ...state.workspace,
                        splitView: {
                            ...state.workspace.splitView,
                            splitRatio:
                                normalizeWorkspaceSplitRatio(splitRatio),
                        },
                    },
                };
            });
        },
        resetWorkspaceSplitView: (): void => {
            const { workspace } = get();

            if (!workspace?.splitView) {
                return;
            }

            set((state) => {
                if (!state.workspace?.splitView) {
                    return {};
                }

                if (
                    state.workspace.splitView.splitRatio ===
                    DEFAULT_WORKSPACE_SPLIT_RATIO
                ) {
                    return {};
                }

                return {
                    workspace: {
                        ...state.workspace,
                        splitView: {
                            ...state.workspace.splitView,
                            splitRatio: DEFAULT_WORKSPACE_SPLIT_RATIO,
                        },
                    },
                };
            });

            if (get().workspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
        toggleWorkspaceSplitView: (): void => {
            const { workspace } = get();

            if (!workspace?.activeTabId) {
                return;
            }

            if (workspace.splitView) {
                get().closeWorkspaceSplitView();
                return;
            }

            get().openWorkspaceTabInPane(workspace.activeTabId, "secondary");
        },
        focusWorkspacePane: (pane: WorkspacePaneId): void => {
            const { workspace } = get();

            if (!workspace?.splitView) {
                return;
            }

            set((state) => {
                if (!state.workspace?.splitView) {
                    return {};
                }

                const { splitView } = state.workspace;

                if (splitView.focusedPane === pane) {
                    return {};
                }

                const focusedTabId =
                    pane === "primary"
                        ? splitView.primaryTabId
                        : splitView.secondaryTabId;

                return {
                    workspace: {
                        ...state.workspace,
                        activeTabId: focusedTabId,
                        splitView: {
                            ...splitView,
                            focusedPane: pane,
                        },
                    },
                };
            });

            if (get().workspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
        closeWorkspaceSplitView: (): void => {
            const { workspace } = get();

            if (!workspace?.splitView) {
                return;
            }

            set((state) => {
                if (!state.workspace?.splitView) {
                    return {};
                }

                const { splitView } = state.workspace;
                const keepTabId =
                    splitView.focusedPane === "primary"
                        ? splitView.primaryTabId
                        : splitView.secondaryTabId;

                return {
                    workspace: {
                        ...state.workspace,
                        activeTabId: keepTabId,
                        splitView: null,
                    },
                };
            });

            if (get().workspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
    };
};
