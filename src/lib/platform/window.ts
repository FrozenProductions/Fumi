import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
    CHECK_FOR_UPDATES_EVENT,
    OPEN_SETTINGS_EVENT,
    PREPARE_FOR_EXIT_EVENT,
    REQUEST_EXIT_GUARD_SYNC_EVENT,
    ZOOM_IN_EVENT,
    ZOOM_OUT_EVENT,
    ZOOM_RESET_EVENT,
} from "../../constants/platform/platform";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { WindowShellError } from "./errors";
import { isTauriEnvironment } from "./runtime";

let initializationPromise: Promise<void> | null = null;
let isPreparingToExitState = false;

const openSettingsListeners = new Set<() => void>();
const checkForUpdatesListeners = new Set<() => void>();
const prepareForExitListeners = new Set<() => void>();
const exitGuardSyncListeners = new Set<(syncId: number) => void>();
const droppedFilesHoverListeners = new Set<(isHovering: boolean) => void>();
const droppedFilesListeners = new Set<(filePaths: readonly string[]) => void>();
const zoomInListeners = new Set<() => void>();
const zoomOutListeners = new Set<() => void>();
const zoomResetListeners = new Set<() => void>();

function createWindowShellError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): WindowShellError {
    return new WindowShellError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}

function notifyListeners(listeners: Set<() => void>): void {
    for (const listener of listeners) {
        listener();
    }
}

async function listenWindowEvent(
    event: string,
    handler: () => void,
): Promise<() => void> {
    try {
        return await listen(event, handler);
    } catch (error) {
        throw createWindowShellError(
            "initializeWindowShell",
            error,
            `Could not subscribe to ${event}.`,
        );
    }
}

async function listenDroppedFilesEvent(): Promise<() => void> {
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
 * Initializes the window shell, subscribing to all window-level events.
 *
 * Idempotent - subsequent calls return the same initialization promise.
 *
 * @returns A promise that resolves when initialization completes
 */
export function initializeWindowShell(): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve();
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        await Promise.all([
            listenWindowEvent(OPEN_SETTINGS_EVENT, () => {
                notifyListeners(openSettingsListeners);
            }),
            listenWindowEvent(CHECK_FOR_UPDATES_EVENT, () => {
                notifyListeners(checkForUpdatesListeners);
            }),
            listenWindowEvent(PREPARE_FOR_EXIT_EVENT, () => {
                isPreparingToExitState = true;
                notifyListeners(prepareForExitListeners);
            }),
            listen<number>(REQUEST_EXIT_GUARD_SYNC_EVENT, (event) => {
                const syncId = Number(event.payload);

                if (!Number.isInteger(syncId) || syncId <= 0) {
                    return;
                }

                for (const listener of exitGuardSyncListeners) {
                    listener(syncId);
                }
            }).catch((error) => {
                throw createWindowShellError(
                    "initializeWindowShell",
                    error,
                    `Could not subscribe to ${REQUEST_EXIT_GUARD_SYNC_EVENT}.`,
                );
            }),
            listenWindowEvent(ZOOM_IN_EVENT, () => {
                notifyListeners(zoomInListeners);
            }),
            listenWindowEvent(ZOOM_OUT_EVENT, () => {
                notifyListeners(zoomOutListeners);
            }),
            listenWindowEvent(ZOOM_RESET_EVENT, () => {
                notifyListeners(zoomResetListeners);
            }),
            listenDroppedFilesEvent(),
        ]);
    })().catch((error) => {
        initializationPromise = null;
        throw error;
    });

    return initializationPromise;
}

/**
 * Returns whether the window is currently preparing to exit.
 */
export function isPreparingToExit(): boolean {
    return isPreparingToExitState;
}

/**
 * Subscribes to the open-settings event from the native menu.
 *
 * @param listener - Callback invoked when settings should open
 * @returns Unsubscribe function
 */
export function subscribeToOpenSettings(listener: () => void): () => void {
    openSettingsListeners.add(listener);

    return () => {
        openSettingsListeners.delete(listener);
    };
}

/**
 * Subscribes to the check-for-updates event from the native menu.
 *
 * @param listener - Callback invoked when update check is requested
 * @returns Unsubscribe function
 */
export function subscribeToCheckForUpdatesRequested(
    listener: () => void,
): () => void {
    checkForUpdatesListeners.add(listener);

    return () => {
        checkForUpdatesListeners.delete(listener);
    };
}

/**
 * Subscribes to the prepare-for-exit event before app quit.
 *
 * @param listener - Callback invoked when app is preparing to quit
 * @returns Unsubscribe function
 */
export function subscribeToPrepareForExit(listener: () => void): () => void {
    prepareForExitListeners.add(listener);

    return () => {
        prepareForExitListeners.delete(listener);
    };
}

/**
 * Subscribes to exit guard sync requests for lifecycle-aware cleanup.
 *
 * @param listener - Callback invoked with a sync ID to resolve
 * @returns Unsubscribe function
 */
export function subscribeToExitGuardSyncRequested(
    listener: (syncId: number) => void,
): () => void {
    exitGuardSyncListeners.add(listener);

    return () => {
        exitGuardSyncListeners.delete(listener);
    };
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

/**
 * Subscribes to zoom-in requests from the native menu or keyboard shortcut.
 *
 * @param listener - Callback invoked when zoom in is requested
 * @returns Unsubscribe function
 */
export function subscribeToZoomInRequested(listener: () => void): () => void {
    zoomInListeners.add(listener);

    return () => {
        zoomInListeners.delete(listener);
    };
}

/**
 * Subscribes to zoom-out requests from the native menu or keyboard shortcut.
 *
 * @param listener - Callback invoked when zoom out is requested
 * @returns Unsubscribe function
 */
export function subscribeToZoomOutRequested(listener: () => void): () => void {
    zoomOutListeners.add(listener);

    return () => {
        zoomOutListeners.delete(listener);
    };
}

/**
 * Subscribes to zoom-reset requests from the native menu or keyboard shortcut.
 *
 * @param listener - Callback invoked when zoom reset is requested
 * @returns Unsubscribe function
 */
export function subscribeToZoomResetRequested(
    listener: () => void,
): () => void {
    zoomResetListeners.add(listener);

    return () => {
        zoomResetListeners.delete(listener);
    };
}

/**
 * Starts window dragging operation (e.g., for custom title bar drag).
 */
export async function startCurrentWindowDragging(): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    try {
        await getCurrentWindow().startDragging();
    } catch (error) {
        throw createWindowShellError(
            "startCurrentWindowDragging",
            error,
            "Could not start dragging the current window.",
        );
    }
}

/**
 * Toggles the maximized state of the current window.
 *
 * @returns True if the window is now maximized
 */
export async function toggleCurrentWindowMaximize(): Promise<boolean> {
    if (!isTauriEnvironment()) {
        return false;
    }

    try {
        const currentWindow = getCurrentWindow();

        await currentWindow.toggleMaximize();

        return await currentWindow.isMaximized();
    } catch (error) {
        throw createWindowShellError(
            "toggleCurrentWindowMaximize",
            error,
            "Could not toggle the current window state.",
        );
    }
}

/**
 * Minimizes the current window to the dock/taskbar.
 */
export async function minimizeCurrentWindow(): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    try {
        await getCurrentWindow().minimize();
    } catch (error) {
        throw createWindowShellError(
            "minimizeCurrentWindow",
            error,
            "Could not minimize the current window.",
        );
    }
}

/**
 * Closes the current window, triggering app quit if it's the last window.
 */
export async function closeCurrentWindow(): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    try {
        await getCurrentWindow().close();
    } catch (error) {
        throw createWindowShellError(
            "closeCurrentWindow",
            error,
            "Could not close the current window.",
        );
    }
}

/**
 * Reads the current maximized state of the window.
 *
 * @returns True if the window is currently maximized
 */
export async function readCurrentWindowMaximizedState(): Promise<boolean> {
    if (!isTauriEnvironment()) {
        return false;
    }

    try {
        return await getCurrentWindow().isMaximized();
    } catch (error) {
        throw createWindowShellError(
            "readCurrentWindowMaximizedState",
            error,
            "Could not read the current window state.",
        );
    }
}

/**
 * Subscribes to window resize events.
 *
 * @param listener - Callback invoked when the window is resized
 * @returns Unsubscribe function
 */
export async function subscribeToCurrentWindowResize(
    listener: () => void,
): Promise<() => void> {
    if (!isTauriEnvironment()) {
        return () => undefined;
    }

    try {
        return await getCurrentWindow().onResized(() => {
            listener();
        });
    } catch (error) {
        throw createWindowShellError(
            "subscribeToCurrentWindowResize",
            error,
            "Could not subscribe to current window resizes.",
        );
    }
}

/**
 * Completes the exit preparation phase, allowing the app to quit.
 */
export async function completeExitPreparation(): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    try {
        await invoke<void>("complete_exit_preparation");
    } catch (error) {
        throw createWindowShellError(
            "completeExitPreparation",
            error,
            "Could not complete exit preparation.",
        );
    }
}

/**
 * Resolves an exit guard sync request with the guard decision.
 *
 * @param syncId - The sync ID from the exit guard event
 * @param shouldGuardExit - Whether to prevent or allow exit
 */
export async function resolveExitGuardSync(
    syncId: number,
    shouldGuardExit: boolean,
): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    try {
        await invoke<void>("resolve_exit_guard_sync", {
            syncId,
            shouldGuardExit,
        });
    } catch (error) {
        throw createWindowShellError(
            "resolveExitGuardSync",
            error,
            "Could not resolve the exit guard state.",
        );
    }
}
