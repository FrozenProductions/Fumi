import { listen } from "@tauri-apps/api/event";
import {
    CHECK_FOR_UPDATES_EVENT,
    OPEN_SETTINGS_EVENT,
    PREPARE_FOR_EXIT_EVENT,
    REQUEST_EXIT_GUARD_SYNC_EVENT,
    ZOOM_IN_EVENT,
    ZOOM_OUT_EVENT,
    ZOOM_RESET_EVENT,
} from "../../constants/platform/platform";
import { isTauriEnvironment } from "./runtime";
import { listenDroppedFilesEvent } from "./windowDropEvents";
import { createWindowShellError } from "./windowShared";

let initializationPromise: Promise<void> | null = null;
let isPreparingToExitState = false;

const openSettingsListeners = new Set<() => void>();
const checkForUpdatesListeners = new Set<() => void>();
const prepareForExitListeners = new Set<() => void>();
const exitGuardSyncListeners = new Set<(syncId: number) => void>();
const zoomInListeners = new Set<() => void>();
const zoomOutListeners = new Set<() => void>();
const zoomResetListeners = new Set<() => void>();

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
