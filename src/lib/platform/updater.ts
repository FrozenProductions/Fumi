import { relaunch } from "@tauri-apps/plugin-process";
import type { DownloadEvent, Update } from "@tauri-apps/plugin-updater";
import { check } from "@tauri-apps/plugin-updater";
import type {
    AppUpdateDownloadProgress,
    AppUpdateMetadata,
} from "../../lib/app/app.type";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { UpdaterError } from "./errors";
import { isTauriEnvironment } from "./runtime";

let pendingUpdate: Update | null = null;
let pendingUpdateVersion: string | null = null;

function createUpdaterError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): UpdaterError {
    return new UpdaterError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}

function mapUpdateMetadata(update: Update): AppUpdateMetadata {
    return {
        currentVersion: update.currentVersion,
        version: update.version,
        date: update.date ?? null,
        body: update.body ?? null,
        rawJson: update.rawJson,
    };
}

async function clearPendingUpdate(): Promise<void> {
    const updateToClose = pendingUpdate;

    pendingUpdate = null;
    pendingUpdateVersion = null;

    if (!updateToClose) {
        return;
    }

    try {
        await updateToClose.close();
    } catch {
        return;
    }
}

async function getPendingUpdateForVersion(version: string): Promise<Update> {
    if (pendingUpdate && pendingUpdateVersion === version) {
        return pendingUpdate;
    }

    let refreshedUpdate: Update | null;

    try {
        refreshedUpdate = await check();
    } catch (error) {
        throw createUpdaterError(
            "getPendingUpdateForVersion",
            error,
            "Could not refresh the pending app update.",
        );
    }

    if (!refreshedUpdate || refreshedUpdate.version !== version) {
        if (refreshedUpdate) {
            try {
                await refreshedUpdate.close();
            } catch {
                return Promise.reject(
                    new UpdaterError({
                        operation: "getPendingUpdateForVersion",
                        message: `Update v${version} is no longer available.`,
                    }),
                );
            }
        }

        throw new UpdaterError({
            operation: "getPendingUpdateForVersion",
            message: `Update v${version} is no longer available.`,
        });
    }

    await clearPendingUpdate();

    pendingUpdate = refreshedUpdate;
    pendingUpdateVersion = refreshedUpdate.version;

    return refreshedUpdate;
}

function mapDownloadProgress(
    event: DownloadEvent,
    downloadedBytes: number,
    contentLength: number | null,
): AppUpdateDownloadProgress {
    const progressPercent =
        contentLength && contentLength > 0
            ? Math.min(100, Math.round((downloadedBytes / contentLength) * 100))
            : null;

    return {
        phase:
            event.event === "Started"
                ? "started"
                : event.event === "Finished"
                  ? "finished"
                  : "progress",
        downloadedBytes,
        contentLength,
        progressPercent,
    };
}

/**
 * Checks for app updates without downloading.
 *
 * @returns Update metadata if an update is available, or null
 */
export async function checkForAppUpdate(): Promise<AppUpdateMetadata | null> {
    if (!isTauriEnvironment()) {
        return null;
    }

    await clearPendingUpdate();

    let update: Update | null;

    try {
        update = await check();
    } catch (error) {
        throw createUpdaterError(
            "checkForAppUpdate",
            error,
            "Could not check for app updates.",
        );
    }

    if (!update) {
        return null;
    }

    pendingUpdate = update;
    pendingUpdateVersion = update.version;

    return mapUpdateMetadata(update);
}

/**
 * Downloads and installs a pending app update.
 *
 * @param updateMetadata - The update metadata from checkForAppUpdate
 * @param onProgress - Optional callback for download progress
 */
export async function downloadAndInstallAppUpdate(
    updateMetadata: AppUpdateMetadata,
    onProgress?: (progress: AppUpdateDownloadProgress) => void,
): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    const update = await getPendingUpdateForVersion(updateMetadata.version);
    let downloadedBytes = 0;
    let contentLength: number | null = null;

    try {
        await update.downloadAndInstall((event) => {
            if (event.event === "Started") {
                contentLength = event.data.contentLength ?? null;
            }

            if (event.event === "Progress") {
                downloadedBytes += event.data.chunkLength;
            }

            if (event.event === "Finished" && contentLength !== null) {
                downloadedBytes = contentLength;
            }

            onProgress?.(
                mapDownloadProgress(event, downloadedBytes, contentLength),
            );
        });
    } catch (error) {
        throw createUpdaterError(
            "downloadAndInstallAppUpdate",
            error,
            `Could not install Fumi v${updateMetadata.version}.`,
        );
    } finally {
        await clearPendingUpdate();
    }
}

/**
 * Relaunches the app after an update has been installed.
 */
export async function relaunchApp(): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    try {
        await relaunch();
    } catch (error) {
        throw createUpdaterError(
            "relaunchApp",
            error,
            "Could not restart the app.",
        );
    }
}
