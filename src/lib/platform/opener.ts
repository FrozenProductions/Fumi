import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import {
    OPEN_PATH_REQUIRED_ERROR,
    OPENER_REQUIRED_ERROR,
} from "../../constants/platform/platform";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { PlatformOperationError } from "./errors";
import { isTauriEnvironment } from "./runtime";

/**
 * Opens a URL in the default external browser.
 *
 * @param url - The URL to open
 */
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

/**
 * Opens a local directory path in the file explorer.
 *
 * @param path - The directory path to open
 */
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
