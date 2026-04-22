import type { DragDropEventHandlers } from "@dnd-kit/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SPLIT_DROP_IDS } from "../../../constants/workspace/workspace";
import {
    normalizeWorkspaceSplitRatio,
    shouldCloseWorkspaceSplitView,
} from "../../../lib/workspace/splitView";
import type {
    WorkspacePaneId,
    WorkspaceSplitView,
} from "../../../lib/workspace/workspace.type";

type UseWorkspaceTabDragDropOptions = {
    splitView: WorkspaceSplitView | null;
    openWorkspaceTabInPane: (tabId: string, pane: WorkspacePaneId) => void;
    reorderWorkspaceTab: (draggedTabId: string, targetTabId: string) => void;
    closeWorkspaceSplitView: () => void;
    setWorkspaceSplitRatio: (splitRatio: number) => void;
    persistWorkspaceState: () => Promise<boolean>;
};

type UseWorkspaceTabDragDropResult = {
    isTabDragActive: boolean;
    splitDropTarget: WorkspacePaneId | null;
    resolvedSplitView: WorkspaceSplitView | null;
    handleDragStart: DragDropEventHandlers["onDragStart"];
    handleDragOver: DragDropEventHandlers["onDragOver"];
    handleDragEnd: DragDropEventHandlers["onDragEnd"];
    handleResizeSplitPreview: (splitRatio: number) => void;
    handleResizeSplitCancel: () => void;
    handleResizeSplitCommit: (splitRatio: number) => void;
};

export function useWorkspaceTabDragDrop({
    splitView,
    openWorkspaceTabInPane,
    reorderWorkspaceTab,
    closeWorkspaceSplitView,
    setWorkspaceSplitRatio,
    persistWorkspaceState,
}: UseWorkspaceTabDragDropOptions): UseWorkspaceTabDragDropResult {
    const [isTabDragActive, setIsTabDragActive] = useState(false);
    const [splitRatioPreview, setSplitRatioPreview] = useState<number | null>(
        null,
    );
    const [splitDropTarget, setSplitDropTarget] =
        useState<WorkspacePaneId | null>(null);
    const lastDropTargetTabIdRef = useRef<string | null>(null);
    const draggedTabIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!splitView) {
            setSplitRatioPreview(null);
        }
    }, [splitView]);

    const resolvedSplitView =
        splitView && splitRatioPreview !== null
            ? {
                  ...splitView,
                  splitRatio: splitRatioPreview,
              }
            : splitView;

    const handleDragOver: DragDropEventHandlers["onDragOver"] = useCallback(
        ({ operation }): void => {
            const draggedTabId = operation.source?.id;
            const targetId = operation.target?.id;

            if (typeof draggedTabId !== "string") {
                return;
            }

            if (targetId === "workspace-split-left") {
                setSplitDropTarget("primary");
                return;
            }

            if (targetId === "workspace-split-right") {
                setSplitDropTarget("secondary");
                return;
            }

            setSplitDropTarget(null);

            if (typeof targetId !== "string" || draggedTabId === targetId) {
                return;
            }

            lastDropTargetTabIdRef.current = targetId;
        },
        [],
    );

    const handleDragStart: DragDropEventHandlers["onDragStart"] = useCallback(
        ({ operation }): void => {
            const tabId = operation.source?.id;

            draggedTabIdRef.current = typeof tabId === "string" ? tabId : null;
            setIsTabDragActive(true);
            setSplitDropTarget(null);
            lastDropTargetTabIdRef.current = null;
        },
        [],
    );

    const handleDragEnd: DragDropEventHandlers["onDragEnd"] = useCallback(
        ({ canceled, operation }): void => {
            const draggedTabId = draggedTabIdRef.current;

            draggedTabIdRef.current = null;
            setIsTabDragActive(false);

            const resolvedSplitTarget = splitDropTarget;
            setSplitDropTarget(null);

            if (canceled || !draggedTabId) {
                lastDropTargetTabIdRef.current = null;
                return;
            }

            if (resolvedSplitTarget) {
                lastDropTargetTabIdRef.current = null;
                openWorkspaceTabInPane(draggedTabId, resolvedSplitTarget);
                return;
            }

            const rawTargetTabId = operation.target?.id;
            const targetTabId =
                typeof rawTargetTabId === "string" &&
                rawTargetTabId !== draggedTabId &&
                !SPLIT_DROP_IDS.has(rawTargetTabId)
                    ? rawTargetTabId
                    : lastDropTargetTabIdRef.current;

            lastDropTargetTabIdRef.current = null;

            if (
                typeof draggedTabId !== "string" ||
                typeof targetTabId !== "string"
            ) {
                return;
            }

            if (splitView) {
                const secondaryTabIdSet = new Set(splitView.secondaryTabIds);
                const draggedIsSecondary = secondaryTabIdSet.has(draggedTabId);
                const targetIsSecondary = secondaryTabIdSet.has(targetTabId);

                if (draggedIsSecondary && !targetIsSecondary) {
                    openWorkspaceTabInPane(draggedTabId, "primary");
                    return;
                }

                if (!draggedIsSecondary && targetIsSecondary) {
                    openWorkspaceTabInPane(draggedTabId, "secondary");
                    return;
                }
            }

            reorderWorkspaceTab(draggedTabId, targetTabId);
        },
        [
            openWorkspaceTabInPane,
            reorderWorkspaceTab,
            splitDropTarget,
            splitView,
        ],
    );

    const handleResizeSplitPreview = useCallback((splitRatio: number): void => {
        setSplitRatioPreview(normalizeWorkspaceSplitRatio(splitRatio));
    }, []);

    const handleResizeSplitCancel = useCallback((): void => {
        setSplitRatioPreview(null);
    }, []);

    const handleResizeSplitCommit = useCallback(
        (splitRatio: number): void => {
            setSplitRatioPreview(null);

            if (!splitView) {
                return;
            }

            if (shouldCloseWorkspaceSplitView(splitRatio)) {
                closeWorkspaceSplitView();
                return;
            }

            setWorkspaceSplitRatio(normalizeWorkspaceSplitRatio(splitRatio));
            void persistWorkspaceState();
        },
        [
            closeWorkspaceSplitView,
            persistWorkspaceState,
            setWorkspaceSplitRatio,
            splitView,
        ],
    );

    return {
        isTabDragActive,
        splitDropTarget,
        resolvedSplitView,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleResizeSplitPreview,
        handleResizeSplitCancel,
        handleResizeSplitCommit,
    };
}
