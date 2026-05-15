import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { WorkspaceEditorSurfaceProps } from "../../components/workspace/editor/WorkspaceEditorSurface.type";
import type { WorkspaceSplitNode } from "../../lib/workspace/session/sessionSplitView.type";

type UseWorkspaceSplitResizeHandleOptions = {
    containerRef: RefObject<HTMLDivElement | null>;
    dividerIndex: number;
    isHorizontal: boolean;
    node: Extract<WorkspaceSplitNode, { type: "split" }>;
    splitViewState: WorkspaceEditorSurfaceProps["splitViewState"];
};

function getResizeSplitRatio(
    event: PointerEvent | ReactPointerEvent<HTMLButtonElement>,
    node: Extract<WorkspaceSplitNode, { type: "split" }>,
    dividerIndex: number,
    container: HTMLDivElement,
): number {
    const rect = container.getBoundingClientRect();
    const size = node.direction === "horizontal" ? rect.width : rect.height;

    if (size <= 0) {
        return node.ratios[dividerIndex] ?? 0.5;
    }

    const pairStartRatio = node.ratios
        .slice(0, dividerIndex)
        .reduce((sum, ratio) => sum + ratio, 0);
    const pairSizeRatio =
        (node.ratios[dividerIndex] ?? 0.5) +
        (node.ratios[dividerIndex + 1] ?? 0.5);
    const pointerOffset =
        node.direction === "horizontal"
            ? event.clientX - rect.left
            : event.clientY - rect.top;
    const pairStart = pairStartRatio * size;
    const pairSize = pairSizeRatio * size;

    if (pairSize <= 0) {
        return 0.5;
    }

    return (pointerOffset - pairStart) / pairSize;
}

export function useWorkspaceSplitResizeHandle({
    containerRef,
    dividerIndex,
    isHorizontal,
    node,
    splitViewState,
}: UseWorkspaceSplitResizeHandleOptions): (
    event: ReactPointerEvent<HTMLButtonElement>,
) => void {
    return (event: ReactPointerEvent<HTMLButtonElement>): void => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const pointerTarget = event.currentTarget;
        pointerTarget.setPointerCapture(event.pointerId);
        document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
        document.body.style.userSelect = "none";

        const updateRatio = (
            pointerEvent: PointerEvent | ReactPointerEvent<HTMLButtonElement>,
            isCommit: boolean,
        ): void => {
            const splitRatio = getResizeSplitRatio(
                pointerEvent,
                node,
                dividerIndex,
                container,
            );

            if (isCommit) {
                splitViewState.onResizeSplitCommit(
                    splitRatio,
                    node.id,
                    dividerIndex,
                );
                return;
            }

            splitViewState.onResizeSplitPreview(
                splitRatio,
                node.id,
                dividerIndex,
            );
        };
        const cleanup = (): void => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerCancel);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
        const handlePointerMove = (moveEvent: PointerEvent): void => {
            updateRatio(moveEvent, false);
        };
        const handlePointerUp = (upEvent: PointerEvent): void => {
            updateRatio(upEvent, true);
            cleanup();
        };
        const handlePointerCancel = (): void => {
            splitViewState.onResizeSplitCancel();
            cleanup();
        };

        updateRatio(event, false);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerCancel);
    };
}
