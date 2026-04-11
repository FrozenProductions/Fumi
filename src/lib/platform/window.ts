import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { WindowShellError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const OPEN_SETTINGS_EVENT = "app://open-settings";
const CHECK_FOR_UPDATES_EVENT = "app://check-for-updates";
const PREPARE_FOR_EXIT_EVENT = "app://prepare-for-exit";
const REQUEST_EXIT_GUARD_SYNC_EVENT = "app://request-exit-guard-sync";
const ZOOM_IN_EVENT = "app://zoom-in";
const ZOOM_OUT_EVENT = "app://zoom-out";
const ZOOM_RESET_EVENT = "app://zoom-reset";

let initializationPromise: Promise<void> | null = null;
let isPreparingToExitState = false;

const openSettingsListeners = new Set<() => void>();
const checkForUpdatesListeners = new Set<() => void>();
const prepareForExitListeners = new Set<() => void>();
const exitGuardSyncListeners = new Set<(syncId: number) => void>();
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
        ]);
    })().catch((error) => {
        initializationPromise = null;
        throw error;
    });

    return initializationPromise;
}

export function isPreparingToExit(): boolean {
    return isPreparingToExitState;
}

export function subscribeToOpenSettings(listener: () => void): () => void {
    openSettingsListeners.add(listener);

    return () => {
        openSettingsListeners.delete(listener);
    };
}

export function subscribeToCheckForUpdatesRequested(
    listener: () => void,
): () => void {
    checkForUpdatesListeners.add(listener);

    return () => {
        checkForUpdatesListeners.delete(listener);
    };
}

export function subscribeToPrepareForExit(listener: () => void): () => void {
    prepareForExitListeners.add(listener);

    return () => {
        prepareForExitListeners.delete(listener);
    };
}

export function subscribeToExitGuardSyncRequested(
    listener: (syncId: number) => void,
): () => void {
    exitGuardSyncListeners.add(listener);

    return () => {
        exitGuardSyncListeners.delete(listener);
    };
}

export function subscribeToZoomInRequested(listener: () => void): () => void {
    zoomInListeners.add(listener);

    return () => {
        zoomInListeners.delete(listener);
    };
}

export function subscribeToZoomOutRequested(listener: () => void): () => void {
    zoomOutListeners.add(listener);

    return () => {
        zoomOutListeners.delete(listener);
    };
}

export function subscribeToZoomResetRequested(
    listener: () => void,
): () => void {
    zoomResetListeners.add(listener);

    return () => {
        zoomResetListeners.delete(listener);
    };
}

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
