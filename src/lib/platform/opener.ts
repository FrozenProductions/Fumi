import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { PlatformOperationError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const OPENER_REQUIRED_ERROR = "Opening links requires the Tauri desktop shell.";
const OPEN_PATH_REQUIRED_ERROR =
    "Opening local folders requires the Tauri desktop shell.";

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

export async function openDirectoryPath(path: string): Promise<void> {
    if (!isTauriEnvironment()) {
        throw new PlatformOperationError({
            operation: "openDirectoryPath",
            message: OPEN_PATH_REQUIRED_ERROR,
        });
    }

    try {
        await openPath(path);
    } catch (error) {
        throw new PlatformOperationError({
            operation: "openDirectoryPath",
            message: getUnknownCauseMessage(error, OPEN_PATH_REQUIRED_ERROR),
        });
    }
}
