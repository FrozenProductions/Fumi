import { isTauri } from "@tauri-apps/api/core";

export function isTauriEnvironment(): boolean {
    return isTauri();
}
