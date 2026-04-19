import { isTauri } from "@tauri-apps/api/core";

export function isTauriEnvironment(): boolean {
    return isTauri();
}

export function isDevRuntime(): boolean {
    return import.meta.env.DEV;
}
