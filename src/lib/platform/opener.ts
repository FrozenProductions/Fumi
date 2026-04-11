import { openUrl } from "@tauri-apps/plugin-opener";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { PlatformOperationError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const OPENER_REQUIRED_ERROR = "Opening links requires the Tauri desktop shell.";

export async function openExternalUrl(url: string): Promise<void> {
    if (!isTauriEnvironment()) {
        globalThis.open?.(url, "_blank", "noopener,noreferrer");
        return;
    }

    try {
        await openUrl(url);
    } catch (error) {
        throw new PlatformOperationError({
            operation: "openExternalUrl",
            message: getUnknownCauseMessage(error, OPENER_REQUIRED_ERROR),
        });
    }
}
