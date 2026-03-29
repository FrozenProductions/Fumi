import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriEnvironment } from "./runtime";

const OPEN_SETTINGS_EVENT = "app://open-settings";
const PREPARE_FOR_EXIT_EVENT = "app://prepare-for-exit";
const REQUEST_EXIT_GUARD_SYNC_EVENT = "app://request-exit-guard-sync";
const ZOOM_IN_EVENT = "app://zoom-in";
const ZOOM_OUT_EVENT = "app://zoom-out";
const ZOOM_RESET_EVENT = "app://zoom-reset";

let initializationPromise: Promise<void> | null = null;
let isPreparingToExitState = false;

const openSettingsListeners = new Set<() => void>();
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

export function initializeWindowShell(): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve();
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = Promise.all([
        listen(OPEN_SETTINGS_EVENT, () => {
            notifyListeners(openSettingsListeners);
        }),
        listen(PREPARE_FOR_EXIT_EVENT, () => {
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
        }),
        listen(ZOOM_IN_EVENT, () => {
            notifyListeners(zoomInListeners);
        }),
        listen(ZOOM_OUT_EVENT, () => {
            notifyListeners(zoomOutListeners);
        }),
        listen(ZOOM_RESET_EVENT, () => {
            notifyListeners(zoomResetListeners);
        }),
    ])
        .then(() => undefined)
        .catch((error) => {
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

    await getCurrentWindow().startDragging();
}

export async function toggleCurrentWindowMaximize(): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    await getCurrentWindow().toggleMaximize();
}

export async function completeExitPreparation(): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    await invoke<void>("complete_exit_preparation");
}

export async function resolveExitGuardSync(
    syncId: number,
    shouldGuardExit: boolean,
): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    await invoke<void>("resolve_exit_guard_sync", {
        syncId,
        shouldGuardExit,
    });
}
