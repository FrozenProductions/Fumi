import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Effect } from "effect";
import { runPromise } from "../shared/effectRuntime";
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

function listenWindowEventEffect(
    event: string,
    handler: () => void,
): Effect.Effect<() => void, WindowShellError> {
    return Effect.tryPromise({
        try: () => listen(event, handler),
        catch: (error) =>
            createWindowShellError(
                "initializeWindowShell",
                error,
                `Could not subscribe to ${event}.`,
            ),
    });
}

export function initializeWindowShell(): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.resolve();
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = runPromise(initializeWindowShellEffect()).catch(
        (error) => {
            initializationPromise = null;
            throw error;
        },
    );

    return initializationPromise;
}

export function initializeWindowShellEffect(): Effect.Effect<
    void,
    WindowShellError
> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return Effect.all([
        listenWindowEventEffect(OPEN_SETTINGS_EVENT, () => {
            notifyListeners(openSettingsListeners);
        }),
        listenWindowEventEffect(CHECK_FOR_UPDATES_EVENT, () => {
            notifyListeners(checkForUpdatesListeners);
        }),
        listenWindowEventEffect(PREPARE_FOR_EXIT_EVENT, () => {
            isPreparingToExitState = true;
            notifyListeners(prepareForExitListeners);
        }),
        Effect.tryPromise({
            try: () =>
                listen<number>(REQUEST_EXIT_GUARD_SYNC_EVENT, (event) => {
                    const syncId = Number(event.payload);

                    if (!Number.isInteger(syncId) || syncId <= 0) {
                        return;
                    }

                    for (const listener of exitGuardSyncListeners) {
                        listener(syncId);
                    }
                }),
            catch: (error) =>
                createWindowShellError(
                    "initializeWindowShell",
                    error,
                    `Could not subscribe to ${REQUEST_EXIT_GUARD_SYNC_EVENT}.`,
                ),
        }),
        listenWindowEventEffect(ZOOM_IN_EVENT, () => {
            notifyListeners(zoomInListeners);
        }),
        listenWindowEventEffect(ZOOM_OUT_EVENT, () => {
            notifyListeners(zoomOutListeners);
        }),
        listenWindowEventEffect(ZOOM_RESET_EVENT, () => {
            notifyListeners(zoomResetListeners);
        }),
    ]).pipe(Effect.asVoid);
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
    return runPromise(startCurrentWindowDraggingEffect());
}

export function startCurrentWindowDraggingEffect(): Effect.Effect<
    void,
    WindowShellError
> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return Effect.tryPromise({
        try: () => getCurrentWindow().startDragging(),
        catch: (error) =>
            createWindowShellError(
                "startCurrentWindowDragging",
                error,
                "Could not start dragging the current window.",
            ),
    });
}

export async function toggleCurrentWindowMaximize(): Promise<boolean> {
    return runPromise(toggleCurrentWindowMaximizeEffect());
}

export function toggleCurrentWindowMaximizeEffect(): Effect.Effect<
    boolean,
    WindowShellError
> {
    if (!isTauriEnvironment()) {
        return Effect.succeed(false);
    }

    return Effect.tryPromise({
        try: async () => {
            const currentWindow = getCurrentWindow();

            await currentWindow.toggleMaximize();

            return currentWindow.isMaximized();
        },
        catch: (error) =>
            createWindowShellError(
                "toggleCurrentWindowMaximize",
                error,
                "Could not toggle the current window state.",
            ),
    });
}

export async function minimizeCurrentWindow(): Promise<void> {
    return runPromise(minimizeCurrentWindowEffect());
}

export function minimizeCurrentWindowEffect(): Effect.Effect<
    void,
    WindowShellError
> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return Effect.tryPromise({
        try: () => getCurrentWindow().minimize(),
        catch: (error) =>
            createWindowShellError(
                "minimizeCurrentWindow",
                error,
                "Could not minimize the current window.",
            ),
    });
}

export async function closeCurrentWindow(): Promise<void> {
    return runPromise(closeCurrentWindowEffect());
}

export function closeCurrentWindowEffect(): Effect.Effect<
    void,
    WindowShellError
> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return Effect.tryPromise({
        try: () => getCurrentWindow().close(),
        catch: (error) =>
            createWindowShellError(
                "closeCurrentWindow",
                error,
                "Could not close the current window.",
            ),
    });
}

export async function readCurrentWindowMaximizedState(): Promise<boolean> {
    return runPromise(readCurrentWindowMaximizedStateEffect());
}

export function readCurrentWindowMaximizedStateEffect(): Effect.Effect<
    boolean,
    WindowShellError
> {
    if (!isTauriEnvironment()) {
        return Effect.succeed(false);
    }

    return Effect.tryPromise({
        try: () => getCurrentWindow().isMaximized(),
        catch: (error) =>
            createWindowShellError(
                "readCurrentWindowMaximizedState",
                error,
                "Could not read the current window state.",
            ),
    });
}

export async function subscribeToCurrentWindowResize(
    listener: () => void,
): Promise<() => void> {
    return runPromise(subscribeToCurrentWindowResizeEffect(listener));
}

export function subscribeToCurrentWindowResizeEffect(
    listener: () => void,
): Effect.Effect<() => void, WindowShellError> {
    if (!isTauriEnvironment()) {
        return Effect.succeed(() => undefined);
    }

    return Effect.tryPromise({
        try: () =>
            getCurrentWindow().onResized(() => {
                listener();
            }),
        catch: (error) =>
            createWindowShellError(
                "subscribeToCurrentWindowResize",
                error,
                "Could not subscribe to current window resizes.",
            ),
    });
}

export async function completeExitPreparation(): Promise<void> {
    return runPromise(completeExitPreparationEffect());
}

export function completeExitPreparationEffect(): Effect.Effect<
    void,
    WindowShellError
> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return Effect.tryPromise({
        try: () => invoke<void>("complete_exit_preparation"),
        catch: (error) =>
            createWindowShellError(
                "completeExitPreparation",
                error,
                "Could not complete exit preparation.",
            ),
    });
}

export async function resolveExitGuardSync(
    syncId: number,
    shouldGuardExit: boolean,
): Promise<void> {
    return runPromise(resolveExitGuardSyncEffect(syncId, shouldGuardExit));
}

export function resolveExitGuardSyncEffect(
    syncId: number,
    shouldGuardExit: boolean,
): Effect.Effect<void, WindowShellError> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return Effect.tryPromise({
        try: () =>
            invoke<void>("resolve_exit_guard_sync", {
                syncId,
                shouldGuardExit,
            }),
        catch: (error) =>
            createWindowShellError(
                "resolveExitGuardSync",
                error,
                "Could not resolve the exit guard state.",
            ),
    });
}
