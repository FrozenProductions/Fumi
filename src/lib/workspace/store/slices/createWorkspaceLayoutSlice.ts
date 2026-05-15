import {
    closeWorkspaceFocusedSplitPaneState,
    focusWorkspacePaneState,
    moveWorkspaceTabToPaneState,
    resizeWorkspaceSplitGroupState,
    selectWorkspaceTabState,
    splitWorkspaceTabState,
} from "../../session/sessionSplitView";
import type { WorkspaceSplitPlacement } from "../../session/sessionSplitView.type";
import { reorderWorkspaceTabs } from "../../session/tabs/sessionTabs";
import { createWorkspaceStoreSupport } from "../createWorkspaceStoreSupport";
import type {
    WorkspaceLayoutSlice,
    WorkspaceStoreSliceCreator,
} from "../workspaceStore.type";

/** Creates the workspace store slice responsible for tab selection, reordering, split view, and pane focus. */
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
        splitWorkspaceTab: (
            tabId: string,
            targetPaneId: string | null,
            placement: WorkspaceSplitPlacement,
        ): void => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            const nextWorkspace = updateWorkspaceForPath(
                workspace.workspacePath,
                (currentWorkspace) =>
                    splitWorkspaceTabState(
                        currentWorkspace,
                        tabId,
                        targetPaneId,
                        placement,
                    ),
            );

            if (nextWorkspace && nextWorkspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
        openWorkspaceTabInPane: (tabId, pane, direction): void => {
            const placement =
                direction === "vertical"
                    ? pane === "primary"
                        ? "top"
                        : "bottom"
                    : pane === "primary"
                      ? "left"
                      : "right";
            get().splitWorkspaceTab(
                tabId,
                get().workspace?.splitView?.activePaneId ?? null,
                placement,
            );
        },
        moveWorkspaceTabToPane: (tabId: string, paneId: string): void => {
            const { workspace } = get();

            if (!workspace) {
                return;
            }

            const nextWorkspace = updateWorkspaceForPath(
                workspace.workspacePath,
                (currentWorkspace) =>
                    moveWorkspaceTabToPaneState(
                        currentWorkspace,
                        tabId,
                        paneId,
                    ),
            );

            if (nextWorkspace && nextWorkspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
        setWorkspaceSplitDirection: (): void => {
            get().resetWorkspaceSplitView();
        },
        setWorkspaceSplitRatio: (
            splitRatio: number,
            splitId?: string,
            dividerIndex?: number,
        ): void => {
            set((state) => {
                if (!state.workspace?.splitView?.root) {
                    return {};
                }

                const nextWorkspace = resizeWorkspaceSplitGroupState(
                    state.workspace,
                    splitRatio,
                    splitId,
                    dividerIndex,
                );

                return nextWorkspace === state.workspace
                    ? {}
                    : {
                          workspace: nextWorkspace,
                          persistRevision: state.persistRevision + 1,
                      };
            });
        },
        resetWorkspaceSplitView: (): void => {
            const { workspace } = get();

            if (
                !workspace?.splitView?.root ||
                workspace.splitView.root.type !== "split"
            ) {
                return;
            }

            set((state) => {
                if (!state.workspace?.splitView?.root) {
                    return {};
                }

                if (state.workspace.splitView.root.type !== "split") {
                    return {};
                }

                const childCount =
                    state.workspace.splitView.root.children.length;
                const ratios = Array.from(
                    { length: childCount },
                    () => 1 / childCount,
                );

                return {
                    workspace: {
                        ...state.workspace,
                        splitView: {
                            ...state.workspace.splitView,
                            root: {
                                ...state.workspace.splitView.root,
                                ratios,
                            },
                        },
                    },
                    persistRevision: state.persistRevision + 1,
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

            get().splitWorkspaceTab(workspace.activeTabId, null, "right");
        },
        focusWorkspacePane: (paneId: string): void => {
            const { workspace } = get();

            if (!workspace?.splitView) {
                return;
            }

            const nextWorkspace = updateWorkspaceForPath(
                workspace.workspacePath,
                (currentWorkspace) =>
                    focusWorkspacePaneState(currentWorkspace, paneId),
            );

            if (nextWorkspace && nextWorkspace !== workspace) {
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

                const nextWorkspace = closeWorkspaceFocusedSplitPaneState(
                    state.workspace,
                );

                return nextWorkspace === state.workspace
                    ? {}
                    : {
                          workspace: nextWorkspace,
                          persistRevision: state.persistRevision + 1,
                      };
            });

            if (get().workspace !== workspace) {
                void get().persistWorkspaceState();
            }
        },
    };
};
