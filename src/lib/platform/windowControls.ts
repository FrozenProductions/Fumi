import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriEnvironment } from "./runtime";
import { createWindowShellError } from "./windowShared";

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
