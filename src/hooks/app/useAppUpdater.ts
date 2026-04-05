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

const STARTUP_UPDATE_CHECK_RETRY_DELAY_MS = 5_000;

export type UseAppUpdaterResult = {
    status: AppUpdaterStatus;
    availableUpdate: AppUpdateMetadata | null;
    downloadProgress: AppUpdateDownloadProgress | null;
    errorMessage: string | null;
    checkForUpdates: () => Promise<void>;
    downloadAndInstallUpdate: () => Promise<void>;
    relaunchToApplyUpdate: () => Promise<void>;
};

type CheckForUpdatesOptions = {
    isSilent?: boolean;
    shouldRetryOnFailure?: boolean;
};

export function useAppUpdater(): UseAppUpdaterResult {
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
        [clearStartupRetry, scheduleStartupRetry],
    );

    runUpdateCheckRef.current = runUpdateCheck;

    const handleDownloadAndInstallUpdate =
        useCallback(async (): Promise<void> => {
            if (!availableUpdate || !isTauriEnvironment()) {
                return;
            }

            await runPromise(
                Effect.gen(function* () {
                    const shouldInstall = yield* confirmActionEffect(
                        `Download and install Fumi v${availableUpdate.version} now?`,
                    );

                    if (!shouldInstall) {
                        return;
                    }

                    setStatus("downloading");
                    setErrorMessage(null);
                    setDownloadProgress(null);

                    yield* downloadAndInstallAppUpdateEffect(
                        availableUpdate,
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
                }).pipe(
                    Effect.catchAll((error) =>
                        Effect.sync(() => {
                            setStatus("error");
                            setErrorMessage(
                                getErrorMessage(
                                    error,
                                    `Unable to install Fumi v${availableUpdate.version}.`,
                                ),
                            );
                        }),
                    ),
                ),
            );
        }, [availableUpdate]);

    const handleRelaunchToApplyUpdate = useCallback(async (): Promise<void> => {
        if (!availableUpdate || !isTauriEnvironment()) {
            return;
        }

        await runPromise(
            Effect.gen(function* () {
                const shouldRelaunch = yield* confirmActionEffect(
                    `Restart Fumi now to finish applying v${availableUpdate.version}?`,
                );

                if (!shouldRelaunch) {
                    return;
                }

                yield* relaunchAppEffect();
            }),
        );
    }, [availableUpdate]);

    useEffect(() => {
        if (!isTauriEnvironment() || hasCompletedStartupCheckRef.current) {
            return;
        }

        hasCompletedStartupCheckRef.current = true;
        void runUpdateCheck({
            isSilent: true,
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
            void runUpdateCheck();
        });
    }, [runUpdateCheck]);

    return {
        status,
        availableUpdate,
        downloadProgress,
        errorMessage,
        checkForUpdates: useCallback(
            async () => runUpdateCheck(),
            [runUpdateCheck],
        ),
        downloadAndInstallUpdate: handleDownloadAndInstallUpdate,
        relaunchToApplyUpdate: handleRelaunchToApplyUpdate,
    };
}
