import { useEffect, useState } from "react";
import { subscribeToDroppedFilesHover } from "../../lib/platform/window/window";
import type { UseAppDragDropResult } from "./useAppDragDrop.type";

/**
 * Manages drag-and-drop state for file drop interactions.
 *
 * @remarks
 * Tracks both native Tauri file hover events and browser drag events to
 * display the drag overlay. Cleans up all event listeners on unmount.
 */
export function useAppDragDrop(): UseAppDragDropResult {
    const [isDragActive, setIsDragActive] = useState(false);

    useEffect(() => {
        const unsubscribeNativeHover = subscribeToDroppedFilesHover(
            (isHovering) => {
                setIsDragActive(isHovering);
            },
        );

        const hasFilePayload = (event: DragEvent): boolean =>
            Array.from(event.dataTransfer?.types ?? []).includes("Files");

        const handleDragEvent = (event: DragEvent): void => {
            if (!hasFilePayload(event)) {
                return;
            }

            event.preventDefault();
            setIsDragActive(
                event.type === "dragenter" || event.type === "dragover",
            );
        };

        window.addEventListener("dragenter", handleDragEvent);
        window.addEventListener("dragleave", handleDragEvent);
        window.addEventListener("dragover", handleDragEvent);
        window.addEventListener("drop", handleDragEvent);
        return () => {
            unsubscribeNativeHover();
            window.removeEventListener("dragenter", handleDragEvent);
            window.removeEventListener("dragleave", handleDragEvent);
            window.removeEventListener("dragover", handleDragEvent);
            window.removeEventListener("drop", handleDragEvent);
        };
    }, []);

    return {
        isDragActive,
    };
}
