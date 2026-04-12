import { useEffect, useState } from "react";
import { subscribeToDroppedFilesHover } from "../../lib/platform/window";
import type { UseAppDragDropResult } from "./useAppDragDrop.type";

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

        const handleDragEnter = (event: DragEvent): void => {
            if (!hasFilePayload(event)) {
                return;
            }

            event.preventDefault();
            setIsDragActive(true);
        };
        const handleDragOver = (event: DragEvent): void => {
            if (!hasFilePayload(event)) {
                return;
            }

            event.preventDefault();
            setIsDragActive(true);
        };
        const handleDragLeave = (event: DragEvent): void => {
            if (!hasFilePayload(event)) {
                return;
            }

            event.preventDefault();
            setIsDragActive(false);
        };
        const handleDrop = (event: DragEvent): void => {
            if (!hasFilePayload(event)) {
                return;
            }

            event.preventDefault();
            setIsDragActive(false);
        };

        window.addEventListener("dragenter", handleDragEnter);
        window.addEventListener("dragleave", handleDragLeave);
        window.addEventListener("dragover", handleDragOver);
        window.addEventListener("drop", handleDrop);
        return () => {
            unsubscribeNativeHover();
            window.removeEventListener("dragenter", handleDragEnter);
            window.removeEventListener("dragleave", handleDragLeave);
            window.removeEventListener("dragover", handleDragOver);
            window.removeEventListener("drop", handleDrop);
        };
    }, []);

    return {
        isDragActive,
    };
}
