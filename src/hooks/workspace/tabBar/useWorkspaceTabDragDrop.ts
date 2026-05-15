import type { DragDropEventHandlers } from "@dnd-kit/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    PANE_DROP_ID_PREFIX,
    SPLIT_DROP_ID_PREFIX,
    SPLIT_DROP_PLACEMENTS,
} from "../../../constants/workspace/workspace";
import { getWorkspaceSplitPaneIdForTab } from "../../../lib/workspace/session/sessionSplitView";
import type {
    WorkspaceSplitPlacement,
    WorkspaceSplitView,
} from "../../../lib/workspace/session/sessionSplitView.type";
import { normalizeWorkspaceSplitRatio } from "../../../lib/workspace/splitView";

export type WorkspaceSplitDropTarget = {
    paneId: string | null;
    placement: WorkspaceSplitPlacement;
};

type UseWorkspaceTabDragDropOptions = {
    splitView: WorkspaceSplitView | null;
    splitWorkspaceTab: (
        tabId: string,
        paneId: string | null,
        placement: WorkspaceSplitPlacement,
    ) => void;
    moveWorkspaceTabToPane: (tabId: string, paneId: string) => void;
    reorderWorkspaceTab: (draggedTabId: string, targetTabId: string) => void;
    setWorkspaceSplitRatio: (
        splitRatio: number,
        splitId?: string,
        dividerIndex?: number,
    ) => void;
    persistWorkspaceState: () => Promise<boolean>;
};

type UseWorkspaceTabDragDropResult = {
    isTabDragActive: boolean;
    splitDropTarget: WorkspaceSplitDropTarget | null;
    resolvedSplitView: WorkspaceSplitView | null;
    handleDragStart: DragDropEventHandlers["onDragStart"];
    handleDragOver: DragDropEventHandlers["onDragOver"];
    handleDragEnd: DragDropEventHandlers["onDragEnd"];
    handleResizeSplitPreview: (
        splitRatio: number,
        splitId: string,
        dividerIndex: number,
    ) => void;
    handleResizeSplitCancel: () => void;
    handleResizeSplitCommit: (
        splitRatio: number,
        splitId: string,
        dividerIndex: number,
    ) => void;
};

function parseSplitDropTarget(
    targetId: string | null | undefined,
): WorkspaceSplitDropTarget | null {
    if (!targetId?.startsWith(`${SPLIT_DROP_ID_PREFIX}:`)) {
        return null;
    }

    const [, paneId, placement] = targetId.split(":");

    if (
        !paneId ||
        !SPLIT_DROP_PLACEMENTS.includes(placement as WorkspaceSplitPlacement)
    ) {
        return null;
    }

    return {
        paneId,
        placement: placement as WorkspaceSplitPlacement,
    };
}

function parsePaneDropTarget(
    targetId: string | null | undefined,
): string | null {
    if (!targetId?.startsWith(`${PANE_DROP_ID_PREFIX}:`)) {
        return null;
    }

    return targetId.slice(PANE_DROP_ID_PREFIX.length + 1) || null;
}

/**
 * Manages tab drag-and-drop interactions including reordering, split-view drops, and split resize.
 */
export function useWorkspaceTabDragDrop({
    splitView,
    splitWorkspaceTab,
    moveWorkspaceTabToPane,
    reorderWorkspaceTab,
    setWorkspaceSplitRatio,
    persistWorkspaceState,
}: UseWorkspaceTabDragDropOptions): UseWorkspaceTabDragDropResult {
    const [isTabDragActive, setIsTabDragActive] = useState(false);
    const [splitDropTarget, setSplitDropTarget] =
        useState<WorkspaceSplitDropTarget | null>(null);
    const lastDropTargetTabIdRef = useRef<string | null>(null);
    const paneDropTargetRef = useRef<string | null>(null);
    const draggedTabIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!splitView) {
            setSplitDropTarget(null);
        }
    }, [splitView]);

    const handleDragOver: DragDropEventHandlers["onDragOver"] = useCallback(
        ({ operation }): void => {
            const draggedTabId = operation.source?.id;
            const targetId = operation.target?.id;

            if (typeof draggedTabId !== "string") {
                return;
            }

            const nextSplitDropTarget =
                typeof targetId === "string"
                    ? parseSplitDropTarget(targetId)
                    : null;

            if (nextSplitDropTarget) {
                setSplitDropTarget(nextSplitDropTarget);
                paneDropTargetRef.current = null;
                return;
            }

            setSplitDropTarget(null);

            const nextPaneDropTarget =
                typeof targetId === "string"
                    ? parsePaneDropTarget(targetId)
                    : null;

            if (nextPaneDropTarget) {
                paneDropTargetRef.current = nextPaneDropTarget;
                return;
            }

            paneDropTargetRef.current = null;

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
            paneDropTargetRef.current = null;
        },
        [],
    );

    const handleDragEnd: DragDropEventHandlers["onDragEnd"] = useCallback(
        ({ canceled, operation }): void => {
            const draggedTabId = draggedTabIdRef.current;

            draggedTabIdRef.current = null;
            setIsTabDragActive(false);

            const resolvedSplitTarget = splitDropTarget;
            const resolvedPaneTarget = paneDropTargetRef.current;
            setSplitDropTarget(null);
            paneDropTargetRef.current = null;

            if (canceled || !draggedTabId) {
                lastDropTargetTabIdRef.current = null;
                return;
            }

            if (resolvedSplitTarget) {
                lastDropTargetTabIdRef.current = null;
                splitWorkspaceTab(
                    draggedTabId,
                    resolvedSplitTarget.paneId,
                    resolvedSplitTarget.placement,
                );
                return;
            }

            if (resolvedPaneTarget) {
                lastDropTargetTabIdRef.current = null;
                moveWorkspaceTabToPane(draggedTabId, resolvedPaneTarget);
                return;
            }

            const rawTargetTabId = operation.target?.id;
            const targetTabId =
                typeof rawTargetTabId === "string" &&
                rawTargetTabId !== draggedTabId &&
                parseSplitDropTarget(rawTargetTabId) === null &&
                parsePaneDropTarget(rawTargetTabId) === null
                    ? rawTargetTabId
                    : lastDropTargetTabIdRef.current;

            lastDropTargetTabIdRef.current = null;

            if (
                typeof draggedTabId !== "string" ||
                typeof targetTabId !== "string"
            ) {
                return;
            }

            const draggedPaneId = getWorkspaceSplitPaneIdForTab(
                splitView,
                draggedTabId,
            );
            const targetPaneId = getWorkspaceSplitPaneIdForTab(
                splitView,
                targetTabId,
            );

            if (targetPaneId && draggedPaneId !== targetPaneId) {
                moveWorkspaceTabToPane(draggedTabId, targetPaneId);
                return;
            }

            reorderWorkspaceTab(draggedTabId, targetTabId);
        },
        [
            moveWorkspaceTabToPane,
            reorderWorkspaceTab,
            splitDropTarget,
            splitView,
            splitWorkspaceTab,
        ],
    );

    const handleResizeSplitPreview = useCallback(
        (splitRatio: number, splitId: string, dividerIndex: number): void => {
            setWorkspaceSplitRatio(
                normalizeWorkspaceSplitRatio(splitRatio),
                splitId,
                dividerIndex,
            );
        },
        [setWorkspaceSplitRatio],
    );

    const handleResizeSplitCancel = useCallback((): void => undefined, []);

    const handleResizeSplitCommit = useCallback(
        (splitRatio: number, splitId: string, dividerIndex: number): void => {
            setWorkspaceSplitRatio(
                normalizeWorkspaceSplitRatio(splitRatio),
                splitId,
                dividerIndex,
            );
            void persistWorkspaceState();
        },
        [persistWorkspaceState, setWorkspaceSplitRatio],
    );

    return {
        isTabDragActive,
        splitDropTarget,
        resolvedSplitView: splitView,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleResizeSplitPreview,
        handleResizeSplitCancel,
        handleResizeSplitCommit,
    };
}
