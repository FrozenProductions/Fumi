import { isTauri } from "@tauri-apps/api/core";

/**
 * Checks whether the app is running inside the Tauri desktop shell.
 *
 * Returns `true` when Tauri APIs are available, `false` in the browser dev preview.
 *
 * @returns Whether the Tauri desktop shell is present
 */
export function isTauriEnvironment(): boolean {
    return isTauri();
}

/**
 * Checks whether the app is running in development mode.
 *
 * @returns Whether the runtime is in development mode
 */
export function isDevRuntime(): boolean {
    return import.meta.env.DEV;
}
