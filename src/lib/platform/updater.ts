import { relaunch } from "@tauri-apps/plugin-process";
import {
    check,
    type DownloadEvent,
    type Update,
} from "@tauri-apps/plugin-updater";
import { Effect } from "effect";
import type {
    AppUpdateDownloadProgress,
    AppUpdateMetadata,
} from "../../lib/app/app.type";
import { runPromise } from "../shared/effectRuntime";
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

function clearPendingUpdateEffect(): Effect.Effect<void, UpdaterError> {
    return Effect.gen(function* () {
        const updateToClose = pendingUpdate;

        pendingUpdate = null;
        pendingUpdateVersion = null;

        if (!updateToClose) {
            return;
        }

        yield* Effect.tryPromise({
            try: () => updateToClose.close(),
            catch: (error) =>
                createUpdaterError(
                    "clearPendingUpdate",
                    error,
                    "Could not clear the cached update handle.",
                ),
        }).pipe(Effect.catchAll(() => Effect.void));
    });
}

function getPendingUpdateForVersionEffect(
    version: string,
): Effect.Effect<Update, UpdaterError> {
    return Effect.gen(function* () {
        if (pendingUpdate && pendingUpdateVersion === version) {
            return pendingUpdate;
        }

        const refreshedUpdate = yield* Effect.tryPromise({
            try: () => check(),
            catch: (error) =>
                createUpdaterError(
                    "getPendingUpdateForVersion",
                    error,
                    "Could not refresh the pending app update.",
                ),
        });

        if (!refreshedUpdate || refreshedUpdate.version !== version) {
            if (refreshedUpdate) {
                yield* Effect.tryPromise({
                    try: () => refreshedUpdate.close(),
                    catch: () => undefined,
                }).pipe(Effect.catchAll(() => Effect.void));
            }

            return yield* Effect.fail(
                new UpdaterError({
                    operation: "getPendingUpdateForVersion",
                    message: `Update v${version} is no longer available.`,
                }),
            );
        }

        yield* clearPendingUpdateEffect();

        pendingUpdate = refreshedUpdate;
        pendingUpdateVersion = refreshedUpdate.version;

        return refreshedUpdate;
    });
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
    return runPromise(checkForAppUpdateEffect());
}

export function checkForAppUpdateEffect(): Effect.Effect<
    AppUpdateMetadata | null,
    UpdaterError
> {
    if (!isTauriEnvironment()) {
        return Effect.succeed(null);
    }

    return Effect.gen(function* () {
        yield* clearPendingUpdateEffect();

        const update = yield* Effect.tryPromise({
            try: () => check(),
            catch: (error) =>
                createUpdaterError(
                    "checkForAppUpdate",
                    error,
                    "Could not check for app updates.",
                ),
        });

        if (!update) {
            return null;
        }

        pendingUpdate = update;
        pendingUpdateVersion = update.version;

        return mapUpdateMetadata(update);
    });
}

export async function downloadAndInstallAppUpdate(
    updateMetadata: AppUpdateMetadata,
    onProgress?: (progress: AppUpdateDownloadProgress) => void,
): Promise<void> {
    return runPromise(
        downloadAndInstallAppUpdateEffect(updateMetadata, onProgress),
    );
}

export function downloadAndInstallAppUpdateEffect(
    updateMetadata: AppUpdateMetadata,
    onProgress?: (progress: AppUpdateDownloadProgress) => void,
): Effect.Effect<void, UpdaterError> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return Effect.gen(function* () {
        const update = yield* getPendingUpdateForVersionEffect(
            updateMetadata.version,
        );
        let downloadedBytes = 0;
        let contentLength: number | null = null;

        try {
            yield* Effect.tryPromise({
                try: () =>
                    update.downloadAndInstall((event) => {
                        if (event.event === "Started") {
                            contentLength = event.data.contentLength ?? null;
                        }

                        if (event.event === "Progress") {
                            downloadedBytes += event.data.chunkLength;
                        }

                        if (
                            event.event === "Finished" &&
                            contentLength !== null
                        ) {
                            downloadedBytes = contentLength;
                        }

                        onProgress?.(
                            mapDownloadProgress(
                                event,
                                downloadedBytes,
                                contentLength,
                            ),
                        );
                    }),
                catch: (error) =>
                    createUpdaterError(
                        "downloadAndInstallAppUpdate",
                        error,
                        `Could not install Fumi v${updateMetadata.version}.`,
                    ),
            });
        } finally {
            yield* clearPendingUpdateEffect();
        }
    });
}

export async function relaunchApp(): Promise<void> {
    return runPromise(relaunchAppEffect());
}

export function relaunchAppEffect(): Effect.Effect<void, UpdaterError> {
    if (!isTauriEnvironment()) {
        return Effect.void;
    }

    return Effect.tryPromise({
        try: () => relaunch(),
        catch: (error) =>
            createUpdaterError(
                "relaunchApp",
                error,
                "Could not restart the app.",
            ),
    });
}
