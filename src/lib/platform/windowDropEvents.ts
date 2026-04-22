import { getCurrentWindow } from "@tauri-apps/api/window";
import { createWindowShellError } from "./windowShared";

const droppedFilesHoverListeners = new Set<(isHovering: boolean) => void>();
const droppedFilesListeners = new Set<(filePaths: readonly string[]) => void>();

export async function listenDroppedFilesEvent(): Promise<() => void> {
    try {
        return await getCurrentWindow().onDragDropEvent((event) => {
            if (
                event.payload.type === "enter" ||
                event.payload.type === "over"
            ) {
                for (const listener of droppedFilesHoverListeners) {
                    listener(true);
                }
                return;
            }

            if (event.payload.type === "leave") {
                for (const listener of droppedFilesHoverListeners) {
                    listener(false);
                }
                return;
            }

            if (event.payload.type !== "drop") {
                return;
            }

            for (const listener of droppedFilesHoverListeners) {
                listener(false);
            }

            const filePaths = event.payload.paths.filter(
                (filePath): filePath is string => filePath.trim().length > 0,
            );

            if (filePaths.length === 0) {
                return;
            }

            for (const listener of droppedFilesListeners) {
                listener(filePaths);
            }
        });
    } catch (error) {
        throw createWindowShellError(
            "initializeWindowShell",
            error,
            "Could not subscribe to dropped files.",
        );
    }
}

/**
 * Subscribes to dropped files events.
 *
 * @param listener - Callback invoked with an array of dropped file paths
 * @returns Unsubscribe function
 */
export function subscribeToDroppedFiles(
    listener: (filePaths: readonly string[]) => void,
): () => void {
    droppedFilesListeners.add(listener);

    return () => {
        droppedFilesListeners.delete(listener);
    };
}

/**
 * Subscribes to drag-hover state changes for dropped files.
 *
 * @param listener - Callback invoked with hover state
 * @returns Unsubscribe function
 */
export function subscribeToDroppedFilesHover(
    listener: (isHovering: boolean) => void,
): () => void {
    droppedFilesHoverListeners.add(listener);

    return () => {
        droppedFilesHoverListeners.delete(listener);
    };
}
