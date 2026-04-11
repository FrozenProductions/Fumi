import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { PlatformOperationError } from "./errors";
import { isTauriEnvironment } from "./runtime";

export async function confirmAction(message: string): Promise<boolean> {
    try {
        if (!isTauriEnvironment()) {
            return window.confirm(message);
        }

        return await invoke<boolean>("show_confirmation_dialog", { message });
    } catch (error) {
        throw new PlatformOperationError({
            operation: "confirmAction",
            message: getUnknownCauseMessage(
                error,
                "Could not open the confirmation dialog.",
            ),
        });
    }
}

export async function pickDirectory(
    defaultPath?: string,
): Promise<string | null> {
    try {
        const selection = await open({
            directory: true,
            multiple: false,
            defaultPath,
        });

        return typeof selection === "string" ? selection : null;
    } catch (error) {
        throw new PlatformOperationError({
            operation: "pickDirectory",
            message: getUnknownCauseMessage(
                error,
                "Could not open the directory picker.",
            ),
        });
    }
}
