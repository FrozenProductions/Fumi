import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { PlatformOperationError } from "./errors";
import { isTauriEnvironment } from "./runtime";

/**
 * Shows a native confirmation dialog and returns whether the user accepted.
 *
 * @param message - The confirmation message to display
 * @returns True if the user accepted, false otherwise
 */
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

/**
 * Opens a native directory picker dialog.
 *
 * @param defaultPath - Optional default directory to start from
 * @returns Selected directory path, or null if cancelled
 */
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
