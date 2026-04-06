import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
    AppUpdateDownloadProgress,
    AppUpdateMetadata,
    AppUpdaterStatus,
} from "../../lib/app/app.type";
import { confirmActionEffect } from "../../lib/platform/dialog";
import { isTauriEnvironment } from "../../lib/platform/runtime";
import {
    checkForAppUpdateEffect,
    downloadAndInstallAppUpdateEffect,
    relaunchAppEffect,
} from "../../lib/platform/updater";
import { subscribeToCheckForUpdatesRequested } from "../../lib/platform/window";
import { runPromise } from "../../lib/shared/effectRuntime";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import { useAppStore } from "./useAppStore";
import type {
    CheckForUpdatesOptions,
    UseAppUpdaterResult,
} from "./useAppUpdater.type";

const STARTUP_UPDATE_CHECK_RETRY_DELAY_MS = 5_000;

export function useAppUpdater(): UseAppUpdaterResult {
    const isAutoUpdateEnabled = useAppStore(
        (state) => state.updaterSettings.isAutoUpdateEnabled,
    );
    const [status, setStatus] = useState<AppUpdaterStatus>(() =>
        isTauriEnvironment() ? "idle" : "unsupported",
    );
    const [availableUpdate, setAvailableUpdate] =
        useState<AppUpdateMetadata | null>(null);
    const [downloadProgress, setDownloadProgress] =
        useState<AppUpdateDownloadProgress | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const hasCompletedStartupCheckRef = useRef(false);
    const hasScheduledStartupRetryRef = useRef(false);
    const startupRetryTimeoutRef = useRef<number | null>(null);
    const runUpdateCheckRef = useRef<
        ((options?: CheckForUpdatesOptions) => Promise<void>) | null
    >(null);

    const requestRelaunchToApplyUpdate = useCallback(
        async (
            updateMetadata: AppUpdateMetadata,
            options?: {
                shouldPrompt?: boolean;
            },
        ): Promise<void> => {
            if (!isTauriEnvironment()) {
                return;
            }

            if (options?.shouldPrompt === false) {
                await runPromise(relaunchAppEffect());
                return;
            }

            await runPromise(
                Effect.gen(function* () {
                    const shouldRelaunch = yield* confirmActionEffect(
                        `Fumi v${updateMetadata.version} is ready to install. Restart now?`,
                    );

                    if (!shouldRelaunch) {
                        setStatus("readyToRestart");
                        return;
                    }

                    yield* relaunchAppEffect();
                }).pipe(
                    Effect.catchAll((error) =>
                        Effect.sync(() => {
                            setStatus("error");
                            setErrorMessage(
                                getErrorMessage(
                                    error,
                                    `Unable to restart Fumi for v${updateMetadata.version}.`,
                                ),
                            );
                        }),
                    ),
                ),
            );
        },
        [],
    );

    const installUpdate = useCallback(
        async (
            updateMetadata: AppUpdateMetadata,
            options?: {
                shouldConfirmBeforeDownload?: boolean;
                shouldPromptAfterInstall?: boolean;
            },
        ): Promise<void> => {
            if (!isTauriEnvironment()) {
                return;
            }

            await runPromise(
                Effect.gen(function* () {
                    if (options?.shouldConfirmBeforeDownload !== false) {
                        const shouldInstall = yield* confirmActionEffect(
                            `Download and install Fumi v${updateMetadata.version} now?`,
                        );

                        if (!shouldInstall) {
                            return;
                        }
                    }

                    setStatus("downloading");
                    setErrorMessage(null);
                    setDownloadProgress(null);

                    yield* downloadAndInstallAppUpdateEffect(
                        updateMetadata,
                        (nextProgress) => {
                            setDownloadProgress(nextProgress);
                            setStatus(
                                nextProgress.phase === "finished"
                                    ? "installing"
                                    : "downloading",
                            );
                        },
                    );

                    setDownloadProgress(null);
                    setStatus("readyToRestart");

                    if (options?.shouldPromptAfterInstall === false) {
                        return;
                    }

                    yield* Effect.promise(() =>
                        requestRelaunchToApplyUpdate(updateMetadata),
                    );
                }).pipe(
                    Effect.catchAll((error) =>
                        Effect.sync(() => {
                            setStatus("error");
                            setErrorMessage(
                                getErrorMessage(
                                    error,
                                    `Unable to install Fumi v${updateMetadata.version}.`,
                                ),
                            );
                        }),
                    ),
                ),
            );
        },
        [requestRelaunchToApplyUpdate],
    );

    const clearStartupRetry = useCallback((): void => {
        if (startupRetryTimeoutRef.current !== null) {
            window.clearTimeout(startupRetryTimeoutRef.current);
            startupRetryTimeoutRef.current = null;
        }
    }, []);

    const scheduleStartupRetry = useCallback((): void => {
        if (hasScheduledStartupRetryRef.current) {
            return;
        }

        hasScheduledStartupRetryRef.current = true;
        clearStartupRetry();
        startupRetryTimeoutRef.current = window.setTimeout(() => {
            startupRetryTimeoutRef.current = null;
            void runUpdateCheckRef.current?.({ isSilent: true });
        }, STARTUP_UPDATE_CHECK_RETRY_DELAY_MS);
    }, [clearStartupRetry]);

    const runUpdateCheck = useCallback(
        async (options?: CheckForUpdatesOptions): Promise<void> => {
            if (!isTauriEnvironment()) {
                setStatus("unsupported");
                return;
            }

            clearStartupRetry();
            setStatus("checking");
            setErrorMessage(null);
            setDownloadProgress(null);

            await runPromise(
                checkForAppUpdateEffect().pipe(
                    Effect.match({
                        onSuccess: (nextUpdate) => {
                            hasScheduledStartupRetryRef.current = false;

                            if (!nextUpdate) {
                                setAvailableUpdate(null);
                                setStatus("upToDate");
                                return;
                            }

                            setAvailableUpdate(nextUpdate);
                            setStatus("available");

                            if (
                                options?.shouldAutoUpdate &&
                                isAutoUpdateEnabled
                            ) {
                                void installUpdate(nextUpdate, {
                                    shouldConfirmBeforeDownload: false,
                                    shouldPromptAfterInstall: true,
                                });
                            }
                        },
                        onFailure: (error) => {
                            const nextErrorMessage = getErrorMessage(
                                error,
                                "Unable to check for updates right now.",
                            );

                            if (options?.isSilent) {
                                setStatus("idle");

                                if (options.shouldRetryOnFailure) {
                                    scheduleStartupRetry();
                                }

                                return;
                            }

                            setStatus("error");
                            setErrorMessage(nextErrorMessage);
                        },
                    }),
                ),
            );
        },
        [
            clearStartupRetry,
            installUpdate,
            isAutoUpdateEnabled,
            scheduleStartupRetry,
        ],
    );

    runUpdateCheckRef.current = runUpdateCheck;

    const handleDownloadAndInstallUpdate =
        useCallback(async (): Promise<void> => {
            if (!availableUpdate || !isTauriEnvironment()) {
                return;
            }

            await installUpdate(availableUpdate, {
                shouldConfirmBeforeDownload: true,
                shouldPromptAfterInstall: false,
            });
        }, [availableUpdate, installUpdate]);

    const handleRelaunchToApplyUpdate = useCallback(async (): Promise<void> => {
        if (!availableUpdate || !isTauriEnvironment()) {
            return;
        }

        await requestRelaunchToApplyUpdate(availableUpdate);
    }, [availableUpdate, requestRelaunchToApplyUpdate]);

    useEffect(() => {
        if (!isTauriEnvironment() || hasCompletedStartupCheckRef.current) {
            return;
        }

        hasCompletedStartupCheckRef.current = true;
        void runUpdateCheck({
            isSilent: true,
            shouldAutoUpdate: true,
            shouldRetryOnFailure: true,
        });
    }, [runUpdateCheck]);

    useEffect(() => {
        return () => {
            clearStartupRetry();
        };
    }, [clearStartupRetry]);

    useEffect(() => {
        return subscribeToCheckForUpdatesRequested(() => {
            void runUpdateCheck({ shouldAutoUpdate: true });
        });
    }, [runUpdateCheck]);

    return {
        status,
        availableUpdate,
        downloadProgress,
        errorMessage,
        checkForUpdates: useCallback(
            async () =>
                runUpdateCheck({
                    shouldAutoUpdate: true,
                }),
            [runUpdateCheck],
        ),
        downloadAndInstallUpdate: handleDownloadAndInstallUpdate,
        relaunchToApplyUpdate: handleRelaunchToApplyUpdate,
    };
}
