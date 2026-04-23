import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { PlatformOperationError } from "./errors";

/**
 * Copies text content to the system clipboard.
 *
 * @param text - The text to copy
 * @throws {PlatformOperationError} If the clipboard operation fails
 */
export async function copyTextToClipboard(text: string): Promise<void> {
    try {
        await writeText(text);
    } catch (error) {
        throw new PlatformOperationError({
            operation: "copyTextToClipboard",
            message: getUnknownCauseMessage(
                error,
                "Could not copy text to the clipboard.",
            ),
        });
    }
}
