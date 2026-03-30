import { relaunch } from "@tauri-apps/plugin-process";
import {
    check,
    type DownloadEvent,
    type Update,
} from "@tauri-apps/plugin-updater";
import type {
    AppUpdateDownloadProgress,
    AppUpdateMetadata,
} from "../../types/app/updater";
import { isTauriEnvironment } from "./runtime";

let pendingUpdate: Update | null = null;
let pendingUpdateVersion: string | null = null;

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
        // Ignore stale resource cleanup failures; the next check will fetch a fresh handle.
    }
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

async function getPendingUpdateForVersion(version: string): Promise<Update> {
    if (pendingUpdate && pendingUpdateVersion === version) {
        return pendingUpdate;
    }

    const refreshedUpdate = await check();

    if (!refreshedUpdate || refreshedUpdate.version !== version) {
        if (refreshedUpdate) {
            await refreshedUpdate.close();
        }

        throw new Error(`Update v${version} is no longer available.`);
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

export async function checkForAppUpdate(): Promise<AppUpdateMetadata | null> {
    if (!isTauriEnvironment()) {
        return null;
    }

    await clearPendingUpdate();

    const update = await check();

    if (!update) {
        return null;
    }

    pendingUpdate = update;
    pendingUpdateVersion = update.version;

    return mapUpdateMetadata(update);
}

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
    } finally {
        await clearPendingUpdate();
    }
}

export async function relaunchApp(): Promise<void> {
    if (!isTauriEnvironment()) {
        return;
    }

    await relaunch();
}
